import type { WorldObject } from "../world-object";
import { query } from "../world-object";
import { vec } from "../math";
import type { SteeringComponent } from "../components/steering";
import type { BehaviourComponent } from "../components/behaviour";
import type { LocomotionComponent } from "../components/locomotion";
import type { MovementLimitsComponent } from "../components/movement-limits";
import type { WanderSteeringComponent } from "../components/wander-steering";
import type { ArriveSteeringComponent } from "../components/arrive-steering";
import type { BoundaryAvoidanceComponent } from "../components/boundary-avoidance";
import type { AlignSteeringComponent } from "../components/align-steering";
import type { SteeringOutput } from "../components/steering-base";
import { getLimits } from "./kinematics";

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
const WORLD_SIZE = 1000; // match canvas size
function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : 1 * v; // keep types simple
}

// Evaluators
function boundaryProximity(pos: { x: number; y: number }, buffer: number) {
  const safeMin = buffer;
  const safeMax = WORLD_SIZE - buffer;
  const px = Math.min((pos.x - safeMin) / buffer, (safeMax - pos.x) / buffer);
  const py = Math.min((pos.y - safeMin) / buffer, (safeMax - pos.y) / buffer);
  const p = 1 - clamp01(Math.min(px, py));
  return clamp01(p);
}

function inwardNormal(pos: { x: number; y: number }, buffer: number) {
  // returns approx inward normal based on closest wall
  const safeMin = buffer;
  const safeMax = WORLD_SIZE - buffer;
  const dxMin = pos.x - safeMin;
  const dxMax = safeMax - pos.x;
  const dyMin = pos.y - safeMin;
  const dyMax = safeMax - pos.y;
  const minPen = Math.min(dxMin, dxMax, dyMin, dyMax);
  if (minPen === dxMin) return vec.make(1, 0);
  if (minPen === dxMax) return vec.make(-1, 0);
  if (minPen === dyMin) return vec.make(0, 1);
  return vec.make(0, -1);
}

function evalWander(o: WorldObject): SteeringOutput | null {
  const beh = o.components.Behaviour as BehaviourComponent | undefined;
  if (!beh || beh.mode !== "Wander") return null;
  const pos = o.components.Position!;
  const kin = o.components.Kinematics!;
  const limits = getLimits(o);
  const w =
    (o.components.WanderSteering as WanderSteeringComponent) || undefined;
  const loco = (o.components.Locomotion as LocomotionComponent) || undefined;
  if (!w && !loco) return null;

  // Gather params with fallback to Locomotion
  const wanderRadius = w?.radius ?? loco!.wanderRadius;
  const wanderDistance = w?.distance ?? loco!.wanderDistance;
  const wanderJitter = w?.jitter ?? loco!.wanderJitter;
  const wanderTimeToTarget = w?.timeToTarget ?? loco!.wanderTimeToTarget;
  const wanderDecayPerSec = w?.decayPerSec ?? loco?.wanderDecayPerSec ?? 2.0;
  const wanderMaxArc = w?.maxArc ?? loco?.wanderMaxArc ?? 1.2;
  const cruise =
    w?.cruiseSpeed ?? loco?.wanderCruiseSpeed ?? limits.maxSpeed * 0.6;
  const debugColor = w?.debugColor ?? "#FF4DFF";
  const baseWeight = w?.weight ?? 1;
  const priority = w?.priority ?? 10;

  // Boundary buffer for deflection/biasing
  const buffer =
    (o.components.BoundaryAvoidance as BoundaryAvoidanceComponent)?.buffer ??
    (o.components.Locomotion as LocomotionComponent)?.boundaryBuffer ??
    60;

  if ((beh as any).wanderAngle === undefined) (beh as any).wanderAngle = 0;

  // Integrate wander angle with capped rate (binomial noise)
  const binomial = Math.random() - Math.random();
  const maxDelta =
    wanderJitter * ((o as any)._dt !== undefined ? (o as any)._dt : 0);
  (beh as any).wanderAngle += clamp(binomial * maxDelta, -maxDelta, maxDelta);

  // Mean-reversion
  (beh as any).wanderAngle -=
    (beh as any).wanderAngle * wanderDecayPerSec * ((o as any)._dt ?? 0);

  // Clamp to forward cone early
  (beh as any).wanderAngle = clamp(
    (beh as any).wanderAngle,
    -wanderMaxArc,
    wanderMaxArc
  );

  // Angle bias: bend wander angle toward inward normal when near walls
  const proxSelf = boundaryProximity(pos, buffer);
  if (proxSelf > 0) {
    const inward = inwardNormal(pos, buffer);
    const inwardAngle = Math.atan2(inward.y, inward.x);
    const currentAngle = kin.orientation + (beh as any).wanderAngle;
    const delta = angleDiff(inwardAngle, currentAngle);
    const maxBend = Math.PI / 3; // up to 60 deg per frame at max proximity
    const bendStrength = Math.min(1, proxSelf * 1.25) * 0.6; // scale
    (beh as any).wanderAngle += clamp(delta, -maxBend, maxBend) * bendStrength;
    // Re-clamp to forward cone
    (beh as any).wanderAngle = clamp(
      (beh as any).wanderAngle,
      -wanderMaxArc,
      wanderMaxArc
    );
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
  const angle = kin.orientation + (beh as any).wanderAngle;
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
      x: clamp(target.x + inward.x * deflect, buffer, WORLD_SIZE - buffer),
      y: clamp(target.y + inward.y * deflect, buffer, WORLD_SIZE - buffer),
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

function evalArrive(o: WorldObject): SteeringOutput | null {
  const beh = o.components.Behaviour as BehaviourComponent | undefined;
  if (!beh || beh.mode !== "Seek") return null;
  const pos = o.components.Position!;
  const kin = o.components.Kinematics!;
  const limits = getLimits(o);
  const a =
    (o.components.ArriveSteering as ArriveSteeringComponent) || undefined;
  const loco = (o.components.Locomotion as LocomotionComponent) || undefined;
  if (!a && !loco) return null;

  // resolve target
  const targetObj = (beh as any).targetId
    ? (o as any)._worldObjects?.find(
        (e: WorldObject) => e.id === (beh as any).targetId
      )
    : undefined;
  const tpos = targetObj?.components.Position;
  if (!tpos) return null;

  const targetRadius = a?.targetRadius ?? loco!.targetRadius;
  const slowRadius = a?.slowRadius ?? loco!.slowRadius;
  const timeToTarget = a?.timeToTarget ?? loco!.timeToTarget;
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
  const loco = (o.components.Locomotion as LocomotionComponent) || undefined;
  // We can still run with defaults if neither exists
  const buffer = b?.buffer ?? loco?.boundaryBuffer ?? 60;
  const lookAhead =
    b?.lookAhead ??
    loco?.boundaryLookAhead ??
    clamp(vec.length(kin.velocity) * 0.8 + limits.maxSpeed * 0.2, 60, 220);
  const strengthBase =
    b?.strength ?? loco?.boundaryStrength ?? limits.maxAcceleration * 0.9;
  const angularScale = b?.angularScale ?? loco?.boundaryAngularScale ?? 0.6;
  const debugColor = b?.debugColor ?? "#AA66FF";
  const priority = b?.priority ?? 100; // high

  const safeMin = buffer;
  const safeMax = WORLD_SIZE - buffer;
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

  const clampedX = clamp(ahead.x, safeMin, safeMax);
  const clampedY = clamp(ahead.y, safeMin, safeMax);
  const offset = vec.make(clampedX - ahead.x, clampedY - ahead.y);

  if (Math.abs(offset.x) < 0.001 && Math.abs(offset.y) < 0.001) return null;

  const proximity =
    1 -
    clamp01(
      Math.min(
        Math.min((ahead.x - safeMin) / buffer, (safeMax - ahead.x) / buffer),
        Math.min((ahead.y - safeMin) / buffer, (safeMax - ahead.y) / buffer)
      )
    );
  const avoidDir = vec.normalize(offset, vec.make(0, 0));
  const accelMag = strengthBase * clamp01(proximity + 0.2);
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
  // Downscale wander when a high-priority avoidance is present
  const hasAvoid = contribs.some(
    (c) => c.name === "Avoid" && (c.priority ?? 0) >= 100
  );
  if (hasAvoid) {
    for (const c of contribs) {
      if (c.name === "Wander") c.weight = (c.weight ?? 1) * 0.2; // heavily suppress wander near walls
    }
  }
  const eps2 = 1e-4;
  const significant = (s: SteeringOutput) =>
    Math.abs(s.angular) > 1e-3 || magnitude2(s.linear) > eps2;
  const sorted = contribs
    .filter(significant)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const top = sorted[0];
  if (top && (top.priority ?? 0) >= 50) {
    return clampSteering(top, limits);
  }
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
  // Attach world objects reference and dt for evaluators that need it
  for (const o of objs) {
    (o as any)._worldObjects = objs;
    (o as any)._dt = dt;
  }

  const actors = query(objs, "Behaviour", "Position", "Kinematics");

  for (const o of actors) {
    const steering = getOrCreateSteering(o);
    steering.linear.x = 0;
    steering.linear.y = 0;
    steering.angular = 0;
    steering.contributions!.length = 0;

    // Evaluate contributions
    const contribs: SteeringOutput[] = [];
    const w = evalWander(o);
    if (w) contribs.push(w);
    const s = evalArrive(o);
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

// Legacy containment keeps agents inside hard bounds with a soft push
export function containmentSystem(objs: WorldObject[], _dt: number) {
  const movers = query(objs, "Position", "Kinematics");
  const worldSize = 1000;
  const margin = 30;
  const turnForce = 0; // set to 0 now that BoundaryAvoidance is in place

  for (const o of movers) {
    if (turnForce === 0) break;
    const pos = o.components.Position!;
    const steering = getOrCreateSteering(o);

    if (pos.x < margin) {
      vec.add(
        steering.linear,
        vec.scale(vec.make(1, 0), turnForce),
        steering.linear
      );
    }
    if (pos.x > worldSize - margin) {
      vec.add(
        steering.linear,
        vec.scale(vec.make(-1, 0), turnForce),
        steering.linear
      );
    }
    if (pos.y < margin) {
      vec.add(
        steering.linear,
        vec.scale(vec.make(0, 1), turnForce),
        steering.linear
      );
    }
    if (pos.y > worldSize - margin) {
      vec.add(
        steering.linear,
        vec.scale(vec.make(0, -1), turnForce),
        steering.linear
      );
    }
  }
}
