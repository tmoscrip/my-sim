import { vec } from "../math";
import { query, type WorldObject } from "../world-object";
import { getLimits } from "./kinematics";
import type { SteeringOutputComponent } from "../components/physics/steering";

export function steeringSystem(objs: WorldObject[], dt: number) {
  // Apply steering forces to entities
  for (const o of query(objs, "SteeringOutput", "Kinematics", "Position")) {
    const steering = o.components.SteeringOutput!;
    const limits = getLimits(o);

    // create map associating steering behaviour functions with their weights
    const steeringBehaviours: [
      (
        o: WorldObject,
        limits: ReturnType<typeof getLimits>,
        objs: WorldObject[]
      ) => SteeringOutputComponent,
      number
    ][] = [
      [fleeFromPlayer, 1],
      [KinematicSeek, 1],
    ];

    // take each behaviour in turn, and apply its steering if non-null by weight in second item
    for (const [behaviour, weight] of steeringBehaviours) {
      const result = behaviour(o, limits, objs);
      if (result) {
        steering.linear.x += result.linear.x * weight;
        steering.linear.y += result.linear.y * weight;
        steering.angular += result.angular * weight;
      }
    }
  }
}

function fleeFromPlayer(
  o: WorldObject,
  limits: ReturnType<typeof getLimits>,
  objs: WorldObject[]
): SteeringOutputComponent {
  if (!o.components.FleeFromPlayer) {
    return { linear: { x: 0, y: 0 }, angular: 0 };
  }

  const players = query(objs, "Position", "PlayerControl");
  if (players.length > 0) {
    const playerPos = players[0].components.Position!;
    const fleeComp = o.components.FleeFromPlayer;
    const toPlayer = vec.sub(playerPos, o.components.Position!, vec.make());
    const distance = vec.length(toPlayer);
    if (distance > 0 && distance < fleeComp.safeDistance) {
      const fleeStrength =
        (fleeComp.safeDistance - distance) / fleeComp.safeDistance;
      // Compute flee direction (normalized away from player)
      const invDist = 1 / distance;
      const fleeDir = {
        x: -toPlayer.x * invDist,
        y: -toPlayer.y * invDist,
      };
      return {
        linear: {
          x: fleeDir.x * limits.maxAcceleration * fleeStrength,
          y: fleeDir.y * limits.maxAcceleration * fleeStrength,
        },
        angular: 0,
      };
    } else if (distance >= fleeComp.safeDistance) {
      // slow to a stop when outside safe distance
      return {
        linear: {
          x: 0,
          y: 0,
        },
        angular: 0,
      };
    }
  }

  return { linear: { x: 0, y: 0 }, angular: 0 };
}

function KinematicSeek(
  o: WorldObject,
  limits: ReturnType<typeof getLimits>,
  objs: WorldObject[]
): SteeringOutputComponent {
  const ks = o.components.KinematicSeek;
  if (!ks) return { linear: { x: 0, y: 0 }, angular: 0 };

  // Ensure we have a target (fallback to player)
  let targetObj = objs.find((obj) => obj.id === ks.target);
  if (!targetObj) {
    const players = query(objs, "Position", "PlayerControl");
    if (players.length === 0) return { linear: { x: 0, y: 0 }, angular: 0 };
    ks.target = players[0].id;
    targetObj = players[0];
  }

  const targetPos = targetObj.components.Position!;
  const selfPos = o.components.Position!;
  const toTarget = vec.sub(targetPos, selfPos, vec.make());
  const distance = vec.length(toTarget);
  if (distance === 0) return { linear: { x: 0, y: 0 }, angular: 0 };

  // Component / limit values with fallbacks
  const arriveRadius = ks.arriveRadius ?? 8;
  const slowRadius = arriveRadius * 4; // allow adding slowRadius later
  const timeToTarget = ks.timeToTarget ?? 0.1; // smoothing factor
  const maxAcceleration = limits.maxAcceleration;
  const maxSpeed = limits.maxSpeed ?? maxAcceleration * 4; // fallback if no maxSpeed

  // Current velocity heuristics (adapt to your Kinematics structure)
  const kin = o.components.Kinematics;
  const vel = kin?.velocity || { x: 0, y: 0 };

  // Inside arrive radius: brake to a stop
  if (distance < arriveRadius) {
    if (Math.abs(vel.x) < 1e-3 && Math.abs(vel.y) < 1e-3) {
      return { linear: { x: 0, y: 0 }, angular: 0 };
    }
    // Brake acceleration opposite velocity
    let brake = { x: -vel.x / timeToTarget, y: -vel.y / timeToTarget };
    const brakeLen = Math.hypot(brake.x, brake.y);
    if (brakeLen > maxAcceleration) {
      brake.x = (brake.x / brakeLen) * maxAcceleration;
      brake.y = (brake.y / brakeLen) * maxAcceleration;
    }
    return { linear: brake, angular: 0 };
  }

  // Desired speed with slowdown in slowRadius
  let targetSpeed = maxSpeed;
  if (distance < slowRadius) {
    targetSpeed = maxSpeed * (distance / slowRadius);
  }

  // Desired velocity
  const dirX = toTarget.x / distance;
  const dirY = toTarget.y / distance;
  const desiredVel = { x: dirX * targetSpeed, y: dirY * targetSpeed };

  // Acceleration needed to reach desired velocity
  let accel = {
    x: (desiredVel.x - vel.x) / timeToTarget,
    y: (desiredVel.y - vel.y) / timeToTarget,
  };

  // Clamp acceleration
  const accelLen = Math.hypot(accel.x, accel.y);
  if (accelLen > maxAcceleration) {
    accel.x = (accel.x / accelLen) * maxAcceleration;
    accel.y = (accel.y / accelLen) * maxAcceleration;
  }

  return { linear: accel, angular: 0 };
}
