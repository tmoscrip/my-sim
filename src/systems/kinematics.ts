import type { MovementLimitsComponent } from "../components";
import type { SteeringOutputComponent } from "../components/physics/steering";
import { vec } from "../math";
import { type WorldObject, query } from "../world-object";

export function updateKinematicsSystem(objs: WorldObject[], dt: number) {
  const movers = query(objs, "Position", "Kinematics");
  for (const o of movers) {
    const kin = o.components.Kinematics!;
    const pos = o.components.Position!;

    const steering = (o.components
      .SteeringOutput as SteeringOutputComponent) || {
      linear: { x: 0, y: 0 },
      angular: 0,
    };

    const limits = getLimits(o);

    // Integrate linear velocity based on damping mode
    const ax = steering.linear.x;
    const ay = steering.linear.y;
    const hasInput = ax * ax + ay * ay > 1e-6;

    switch (limits.dampingMode) {
      case "Drag": // Mode 1: Viscous drag (original)
        kin.velocity.x += (ax - limits.linearDamping * kin.velocity.x) * dt;
        kin.velocity.y += (ay - limits.linearDamping * kin.velocity.y) * dt;
        break;

      case "Friction": // Mode 2: Friction only when no input
        if (hasInput) {
          kin.velocity.x += ax * dt;
          kin.velocity.y += ay * dt;
        } else {
          const decay = Math.exp(-limits.linearDamping * dt);
          kin.velocity.x *= decay;
          kin.velocity.y *= decay;
        }
        break;

      case "Hybrid": // Mode 3: Light drag + friction
      default:
        if (hasInput) {
          const lightDrag = 0.15 * limits.linearDamping;
          kin.velocity.x += (ax - lightDrag * kin.velocity.x) * dt;
          kin.velocity.y += (ay - lightDrag * kin.velocity.y) * dt;
        } else {
          const decay = Math.exp(-limits.linearDamping * dt);
          kin.velocity.x *= decay;
          kin.velocity.y *= decay;
        }
        break;
    }

    // Integrate position
    pos.x += kin.velocity.x * dt;
    pos.y += kin.velocity.y * dt;

    // Integrate angular velocity and orientation
    kin.rotation +=
      (steering.angular - limits.angularDamping * kin.rotation) * dt;
    kin.orientation += kin.rotation * dt;

    // Wrap orientation to [-PI, PI]
    while (kin.orientation > Math.PI) kin.orientation -= Math.PI * 2;
    while (kin.orientation < -Math.PI) kin.orientation += Math.PI * 2;

    // Clamp speed to per-entity maxSpeed
    const speed = vec.length(kin.velocity);
    const speedCap = limits.maxSpeed;
    if (speed > speedCap) {
      vec.scale(kin.velocity, speedCap / speed, kin.velocity);
    }
  }
}

export function getLimits(o: WorldObject) {
  const limits =
    (o.components.MovementLimits as MovementLimitsComponent) || undefined;
  return {
    maxSpeed: limits?.maxSpeed ?? 100,
    maxAcceleration: limits?.maxAcceleration ?? 800,
    maxRotation: limits?.maxRotation ?? 5,
    maxAngularAcceleration: limits?.maxAngularAcceleration ?? 10,
    linearDamping: limits?.linearDamping ?? 5.8,
    angularDamping: limits?.angularDamping ?? 0.9,
    dampingMode: limits?.dampingMode ?? "hybrid",
  };
}
