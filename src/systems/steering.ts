import type { WorldObject } from "../world-object";
import { query } from "../world-object";
import { vec } from "../math";
import type { SteeringComponent } from "../components/steering";
import type {
  BehaviourComponent,
  WanderSteeringComponent,
  ArriveSteeringComponent,
  BoundaryAvoidanceComponent,
} from "../components";
import type { SteeringOutput } from "../components/steering-base";
import { getLimits } from "./kinematics";
import { WorldConfig } from "../config";

// Helpers
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function angleDiff(target: number, current: number) {
  let d = target - current;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function sign(n: number) {
  return n >= 0 ? 1 : -1;
}

function getOrCreateSteering(o: WorldObject): SteeringComponent {
  if (!o.components.Steering) {
    o.components.Steering = {
      linear: vec.make(0, 0),
      angular: 0,
      contributions: [],
    };
  }
  if (!o.components.Steering.contributions)
    o.components.Steering.contributions = [];
  return o.components.Steering;
}

// Align behavior (AI for Games 3.2): returns angular acceleration
function alignAngularAccel(
  currentOrientation: number,
  currentRotation: number,
  targetOrientation: number,
  params: {
    maxRotation: number;
    maxAngularAcceleration: number;
    angularTargetRadius: number;
    angularSlowRadius: number;
    angularTimeToTarget: number;
  }
) {
  // Compute smallest angle between orientations
  let rotation = angleDiff(targetOrientation, currentOrientation);
  const rotationSize = Math.abs(rotation);

  // If close enough, stop rotating
  if (rotationSize < params.angularTargetRadius) {
    return -currentRotation / Math.max(params.angularTimeToTarget, 0.0001);
  }

  // Determine target rotation (speed)
  let targetRotation: number;
  if (rotationSize > params.angularSlowRadius) {
    targetRotation = params.maxRotation;
  } else {
    targetRotation =
      params.maxRotation * (rotationSize / params.angularSlowRadius);
  }
  targetRotation *= sign(rotation);

  // Compute needed angular acceleration to match target rotation over time
  let angular =
    (targetRotation - currentRotation) /
    Math.max(params.angularTimeToTarget, 0.0001);

  // Cap to maximum
  angular = clamp(
    angular,
    -params.maxAngularAcceleration,
    params.maxAngularAcceleration
  );

  return angular;
}

// WORLD
// Use world dimensions from WorldConfig instead of fixed size
function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : 1 * v; // keep types simple
}

// Evaluators
function boundaryProximity(pos: { x: number; y: number }, buffer: number) {
  const safeMinX = buffer;
  const safeMinY = buffer;
  const safeMaxX = WorldConfig.world.width - buffer;
  const safeMaxY = WorldConfig.world.height - buffer;
  const px = Math.min((pos.x - safeMinX) / buffer, (safeMaxX - pos.x) / buffer);
  const py = Math.min((pos.y - safeMinY) / buffer, (safeMaxY - pos.y) / buffer);
  const p = 1 - clamp01(Math.min(px, py));
  return clamp01(p);
}

function inwardNormal(pos: { x: number; y: number }, buffer: number) {
  // Returns a simple inward normal that prevents corner oscillation
  const safeMinX = buffer;
  const safeMinY = buffer;
  const safeMaxX = WorldConfig.world.width - buffer;
  const safeMaxY = WorldConfig.world.height - buffer;

  // Calculate distances to each wall
  const leftDist = pos.x - safeMinX;
  const rightDist = safeMaxX - pos.x;
  const topDist = pos.y - safeMinY;
  const bottomDist = safeMaxY - pos.y;

  // Find the closest wall
  const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

  let forceX = 0;
  let forceY = 0;

  // Only apply force from the single closest wall to prevent competing forces
  if (minDist === leftDist && leftDist < buffer) {
    forceX = 1; // Push right
  } else if (minDist === rightDist && rightDist < buffer) {
    forceX = -1; // Push left
  } else if (minDist === topDist && topDist < buffer) {
    forceY = 1; // Push down
  } else if (minDist === bottomDist && bottomDist < buffer) {
    forceY = -1; // Push up
  }

  // If in a tight corner (very close to multiple walls), bias toward center
  const isInTightCorner =
    (leftDist < buffer * 0.3 || rightDist < buffer * 0.3) &&
    (topDist < buffer * 0.3 || bottomDist < buffer * 0.3);

  if (isInTightCorner) {
    const centerX = WorldConfig.world.width / 2;
    const centerY = WorldConfig.world.height / 2;
    const toCenterX = centerX - pos.x;
    const toCenterY = centerY - pos.y;
    const centerDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);

    if (centerDist > 0.01) {
      forceX = toCenterX / centerDist;
      forceY = toCenterY / centerDist;
    }
  }

  // Fallback to center if no force
  if (Math.abs(forceX) < 0.01 && Math.abs(forceY) < 0.01) {
    const centerX = WorldConfig.world.width / 2;
    const centerY = WorldConfig.world.height / 2;
    forceX = (centerX - pos.x) / Math.max(centerX, centerY);
    forceY = (centerY - pos.y) / Math.max(centerX, centerY);
  }

  const result = vec.make(forceX, forceY);
  return vec.length(result) > 0.01
    ? vec.normalize(result, vec.make(0, 0))
    : vec.make(0, 1);
}

function evalWander(o: WorldObject, dt: number): SteeringOutput | null {
  const beh = o.components.Behaviour as BehaviourComponent | undefined;
  if (!beh || beh.mode !== "Wander") return null;
  const pos = o.components.Position!;
  const kin = o.components.Kinematics!;
  const limits = getLimits(o);
  const w =
    (o.components.WanderSteering as WanderSteeringComponent) || undefined;
  if (!w) return null;

  const wanderRadius = w?.radius;
  const wanderDistance = w?.distance;
  const wanderJitter = w?.jitter;
  const wanderTimeToTarget = w?.timeToTarget;
  const wanderDecayPerSec = w?.decayPerSec ?? 2.0;
  const wanderMaxArc = w?.maxArc ?? 1.2;
  const cruise = w?.cruiseSpeed ?? limits.maxSpeed * 0.6;
  const debugColor = w?.debugColor ?? "#FF4DFF";
  const baseWeight = w?.weight ?? 1;
  const priority = w?.priority ?? 10;

  // Boundary buffer for deflection/biasing
  const buffer =
    (o.components.BoundaryAvoidance as BoundaryAvoidanceComponent)?.buffer ??
    60;

  if (beh.wanderAngle === undefined) beh.wanderAngle = 0;

  // Integrate wander angle with capped rate (binomial noise)
  const binomial = Math.random() - Math.random();
  const maxDelta = wanderJitter * dt;
  beh.wanderAngle += clamp(binomial * maxDelta, -maxDelta, maxDelta);

  // Mean-reversion
  beh.wanderAngle -= beh.wanderAngle * wanderDecayPerSec * dt;

  // Clamp to forward cone early
  beh.wanderAngle = clamp(beh.wanderAngle, -wanderMaxArc, wanderMaxArc);

  // Angle bias: bend wander angle toward inward normal when near walls
  const proxSelf = boundaryProximity(pos, buffer);
  if (proxSelf > 0) {
    const inward = inwardNormal(pos, buffer);
    const inwardAngle = Math.atan2(inward.y, inward.x);
    const currentAngle = kin.orientation + beh.wanderAngle;
    const delta = angleDiff(inwardAngle, currentAngle);
    const maxBend = Math.PI / 3; // up to 60 deg per frame at max proximity
    const bendStrength = Math.min(1, proxSelf * 1.25) * 0.6; // scale
    beh.wanderAngle += clamp(delta, -maxBend, maxBend) * bendStrength;
    // Re-clamp to forward cone
    beh.wanderAngle = clamp(beh.wanderAngle, -wanderMaxArc, wanderMaxArc);
  }

  // Circle center and target (after bias)
  const forward = {
    x: Math.cos(kin.orientation),
    y: Math.sin(kin.orientation),
  };
  const circleCenter = vec.add(
    vec.clone(pos),
    vec.scale(forward, wanderDistance, vec.make(0, 0)),
    vec.make(0, 0)
  );
  const angle = kin.orientation + beh.wanderAngle;
  let target = {
    x: circleCenter.x + Math.cos(angle) * wanderRadius,
    y: circleCenter.y + Math.sin(angle) * wanderRadius,
  };

  // Deflect the target away from boundaries to encourage turning back inside
  const proxCenter = boundaryProximity(circleCenter, buffer);
  const proxTarget = boundaryProximity(target, buffer);
  const proxDeflect = Math.max(proxCenter, proxTarget);
  if (proxDeflect > 0) {
    const inward = inwardNormal(target, buffer);
    const maxDeflect = wanderRadius * 1.0; // allow full slide on the circle
    const deflect = Math.min(1, proxDeflect) * maxDeflect;
    target = {
      x: clamp(
        target.x + inward.x * deflect,
        buffer,
        WorldConfig.world.width - buffer
      ),
      y: clamp(
        target.y + inward.y * deflect,
        buffer,
        WorldConfig.world.height - buffer
      ),
    };
  }

  // Direction toward (possibly deflected) target
  const toTarget = vec.sub(target, vec.clone(pos), vec.make(0, 0));
  const dir = vec.normalize(toTarget, vec.make(0, 0));
  let usedDir = dir;

  // Base desired acceleration toward wander target
  const desiredVelocityBase = vec.scale(
    usedDir,
    Math.min(cruise, limits.maxSpeed),
    vec.make(0, 0)
  );
  let linear = vec.sub(
    desiredVelocityBase,
    vec.clone(kin.velocity),
    vec.make(0, 0)
  );
  vec.scale(linear, 1 / Math.max(wanderTimeToTarget, 0.0001), linear);

  // Additional bias: if we're personally near a wall, blend direction with inward normal
  if (proxSelf > 0) {
    const inward = inwardNormal(pos, buffer);
    const blend = Math.min(0.7, proxSelf * 0.8);
    const blendedDir = vec.normalize(
      vec.add(
        vec.scale(usedDir, 1 - blend, vec.make(0, 0)),
        vec.scale(inward, blend, vec.make(0, 0)),
        vec.make(0, 0)
      ),
      vec.make(0, 0)
    );
    usedDir = blendedDir;
    const desiredVelocity2 = vec.scale(
      usedDir,
      Math.min(cruise, limits.maxSpeed),
      vec.make(0, 0)
    );
    linear = vec.sub(desiredVelocity2, vec.clone(kin.velocity), vec.make(0, 0));
    vec.scale(linear, 1 / Math.max(wanderTimeToTarget, 0.0001), linear);
  }

  const linMag = vec.length(linear);
  if (linMag > (limits.maxAcceleration ?? 800)) {
    vec.scale(linear, (limits.maxAcceleration ?? 800) / linMag, linear);
  }

  const desiredOrientation = Math.atan2(usedDir.y, usedDir.x);
  const angular = alignAngularAccel(
    kin.orientation,
    kin.rotation,
    desiredOrientation,
    {
      maxRotation: limits.maxRotation,
      maxAngularAcceleration: limits.maxAngularAcceleration,
      angularTargetRadius: limits.angularTargetRadius,
      angularSlowRadius: limits.angularSlowRadius,
      angularTimeToTarget: limits.angularTimeToTarget,
    }
  );

  // Reduce wander influence when very close to walls even if Avoid isn't active yet
  const weight = baseWeight * (1 - Math.min(0.8, proxSelf * 0.6));

  return { linear, angular, debugColor, weight, priority, name: "Wander" };
}

function evalArrive(
  o: WorldObject,
  worldObjects: WorldObject[]
): SteeringOutput | null {
  const beh = o.components.Behaviour as BehaviourComponent | undefined;
  if (!beh || beh.mode !== "Seek") return null;
  const pos = o.components.Position!;
  const kin = o.components.Kinematics!;
  const limits = getLimits(o);
  const a =
    (o.components.ArriveSteering as ArriveSteeringComponent) || undefined;
  if (!a) return null;

  // resolve target
  const targetObj = beh.targetId
    ? worldObjects.find((e: WorldObject) => e.id === beh.targetId)
    : undefined;
  const tpos = targetObj?.components.Position;
  if (!tpos) return null;

  const targetRadius = a?.targetRadius ?? 0.05;
  const slowRadius = a?.slowRadius ?? 0.6;
  const timeToTarget = a?.timeToTarget ?? 0.1;
  const debugColor = a?.debugColor ?? "#FFA500";
  const weight = a?.weight ?? 1;
  const priority = a?.priority ?? 20;

  const toTarget = vec.sub(vec.clone(tpos), vec.clone(pos), vec.make(0, 0));
  const distance = vec.length(toTarget);

  let targetSpeed = limits.maxSpeed;
  if (distance < targetRadius) targetSpeed = 0;
  else if (distance < slowRadius)
    targetSpeed = limits.maxSpeed * (distance / slowRadius);

  let desiredVelocity = vec.make(0, 0);
  if (distance > 0) {
    desiredVelocity = vec.scale(
      vec.normalize(toTarget, vec.make(0, 0)),
      targetSpeed,
      vec.make(0, 0)
    );
  }

  let linear = vec.sub(
    desiredVelocity,
    vec.clone(kin.velocity),
    vec.make(0, 0)
  );
  vec.scale(linear, 1 / Math.max(timeToTarget, 0.0001), linear);
  const linMag = vec.length(linear);
  if (linMag > (limits.maxAcceleration ?? 800)) {
    vec.scale(linear, (limits.maxAcceleration ?? 800) / linMag, linear);
  }

  const speed = vec.length(kin.velocity);
  const desiredOrientation =
    speed > 1
      ? Math.atan2(kin.velocity.y, kin.velocity.x)
      : Math.atan2(toTarget.y, toTarget.x);
  const angular = alignAngularAccel(
    kin.orientation,
    kin.rotation,
    desiredOrientation,
    {
      maxRotation: limits.maxRotation,
      maxAngularAcceleration: limits.maxAngularAcceleration,
      angularTargetRadius: limits.angularTargetRadius,
      angularSlowRadius: limits.angularSlowRadius,
      angularTimeToTarget: limits.angularTimeToTarget,
    }
  );

  return { linear, angular, debugColor, weight, priority, name: "Arrive" };
}

function evalBoundaryAvoid(o: WorldObject): SteeringOutput | null {
  const pos = o.components.Position!;
  const kin = o.components.Kinematics!;
  const limits = getLimits(o);
  const b =
    (o.components.BoundaryAvoidance as BoundaryAvoidanceComponent) || undefined;
  // We can still run with defaults if neither exists
  const buffer = b?.buffer ?? 60;
  const lookAhead =
    b?.lookAhead ??
    clamp(vec.length(kin.velocity) * 0.8 + limits.maxSpeed * 0.2, 60, 220);
  const strengthBase = b?.strength ?? limits.maxAcceleration * 0.4; // Further reduced strength
  const angularScale = b?.angularScale ?? 0.3; // Further reduced angular influence
  const debugColor = b?.debugColor ?? "#AA66FF";
  const priority = b?.priority ?? 150; // High but not overwhelming

  const safeMinX = buffer;
  const safeMinY = buffer;
  const safeMaxX = WorldConfig.world.width - buffer;
  const safeMaxY = WorldConfig.world.height - buffer;

  // Check current position proximity to walls
  const currentProximity = boundaryProximity(pos, buffer);

  // Check ahead position
  const speed = vec.length(kin.velocity);
  const forward =
    speed > 1
      ? vec.normalize(kin.velocity, vec.make(0, 0))
      : { x: Math.cos(kin.orientation), y: Math.sin(kin.orientation) };
  const ahead = vec.add(
    vec.clone(pos),
    vec.scale(forward, lookAhead, vec.make(0, 0)),
    vec.make(0, 0)
  );

  const clampedX = clamp(ahead.x, safeMinX, safeMaxX);
  const clampedY = clamp(ahead.y, safeMinY, safeMaxY);
  const offset = vec.make(clampedX - ahead.x, clampedY - ahead.y);

  let avoidDir = vec.make(0, 0);
  let proximity = 0;

  // Only trigger avoidance if actually needed
  if (currentProximity > 0.8) {
    // Very close to wall - use strong immediate avoidance
    avoidDir = inwardNormal(pos, buffer);
    proximity = currentProximity;
  } else if (Math.abs(offset.x) > 0.001 || Math.abs(offset.y) > 0.001) {
    // Look-ahead avoidance - gentle steering
    avoidDir = vec.normalize(offset, vec.make(0, 0));
    proximity =
      0.5 *
      (1 -
        clamp01(
          Math.min(
            Math.min(
              (ahead.x - safeMinX) / buffer,
              (safeMaxX - ahead.x) / buffer
            ),
            Math.min(
              (ahead.y - safeMinY) / buffer,
              (safeMaxY - ahead.y) / buffer
            )
          )
        ));
  } else {
    return null; // No avoidance needed
  }

  // Smooth acceleration based on proximity (not binary)
  const accelMag = strengthBase * Math.pow(clamp01(proximity), 2); // Quadratic falloff
  const linear = vec.scale(avoidDir, accelMag, vec.make(0, 0));

  const desiredOrientation = Math.atan2(avoidDir.y, avoidDir.x);
  const angular =
    alignAngularAccel(kin.orientation, kin.rotation, desiredOrientation, {
      maxRotation: limits.maxRotation,
      maxAngularAcceleration: limits.maxAngularAcceleration,
      angularTargetRadius: limits.angularTargetRadius,
      angularSlowRadius: limits.angularSlowRadius,
      angularTimeToTarget: limits.angularTimeToTarget,
    }) * angularScale;

  return { linear, angular, debugColor, priority, name: "Avoid" };
}

function magnitude2(s: { x: number; y: number }) {
  return s.x * s.x + s.y * s.y;
}

function aggregate(
  contribs: SteeringOutput[],
  limits: ReturnType<typeof getLimits>
): SteeringOutput {
  // Gentle downscaling when avoidance is present (don't eliminate wander entirely)
  const hasAvoid = contribs.some(
    (c) => c.name === "Avoid" && (c.priority ?? 0) >= 100
  );
  if (hasAvoid) {
    for (const c of contribs) {
      if (c.name === "Wander") c.weight = (c.weight ?? 1) * 0.5; // gentle suppression instead of heavy
    }
  }

  const eps2 = 1e-4;
  const significant = (s: SteeringOutput) =>
    Math.abs(s.angular) > 1e-3 || magnitude2(s.linear) > eps2;
  contribs.filter(significant);

  // Use blended approach for smoother behavior
  let lin = vec.make(0, 0);
  let ang = 0;
  let totalW = 0;
  for (const s of contribs) {
    const w = s.weight ?? 1;
    lin.x += s.linear.x * w;
    lin.y += s.linear.y * w;
    ang += s.angular * w;
    totalW += w;
  }
  if (totalW > 0 && totalW !== 1) {
    lin.x /= totalW;
    lin.y /= totalW;
    ang /= totalW;
  }
  return clampSteering(
    { linear: lin, angular: ang, name: "Blend" } as SteeringOutput,
    limits
  );
}

function clampSteering(
  s: SteeringOutput,
  limits: ReturnType<typeof getLimits>
): SteeringOutput {
  const maxA = limits.maxAcceleration;
  const mag2 = magnitude2(s.linear);
  if (mag2 > maxA * maxA) {
    const m = Math.sqrt(mag2);
    s.linear.x = (s.linear.x / m) * maxA;
    s.linear.y = (s.linear.y / m) * maxA;
  }
  const maxAA = limits.maxAngularAcceleration;
  if (Math.abs(s.angular) > maxAA) s.angular = Math.sign(s.angular) * maxAA;
  return s;
}

// Main behaviour system now evaluates all steering sources and aggregates them
export function behaviourSystem(objs: WorldObject[], dt: number) {
  const actors = query(objs, "Behaviour", "Position", "Kinematics");

  for (const o of actors) {
    const steering = getOrCreateSteering(o);
    steering.linear.x = 0;
    steering.linear.y = 0;
    steering.angular = 0;
    steering.contributions!.length = 0;

    // Evaluate contributions
    const contribs: SteeringOutput[] = [];
    const w = evalWander(o, dt);
    if (w) contribs.push(w);
    const s = evalArrive(o, objs);
    if (s) contribs.push(s);
    const b = evalBoundaryAvoid(o);
    if (b) contribs.push(b);

    // Aggregate
    const final = aggregate(contribs, getLimits(o));

    // Accumulate into Steering and store breakdown for debug
    steering.contributions!.push(...contribs);
    vec.add(steering.linear, final.linear, steering.linear);
    steering.angular += final.angular;
  }
}
