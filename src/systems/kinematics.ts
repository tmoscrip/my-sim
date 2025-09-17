import type {
  MovementLimitsComponent,
  AlignSteeringComponent,
} from "../components";
import { vec } from "../math";
import { type WorldObject, query } from "../world-object";

export function updateKinematicsSystem(objs: WorldObject[], dt: number) {
  const movers = query(objs, "Position", "Kinematics");
  for (const o of movers) {
    const kin = o.components.Kinematics!;
    const pos = o.components.Position!;

    const steering = o.components.Steering || {
      linear: vec.make(0, 0),
      angular: 0,
    };

    const limits = getLimits(o);

    const linearDamping = 0.8;
    const angularDamping = 0.9;

    // Integrate linear velocity
    kin.velocity.x += (steering.linear.x - linearDamping * kin.velocity.x) * dt;
    kin.velocity.y += (steering.linear.y - linearDamping * kin.velocity.y) * dt;

    // Integrate position
    pos.x += kin.velocity.x * dt;
    pos.y += kin.velocity.y * dt;

    // Integrate angular velocity and orientation
    kin.rotation += (steering.angular - angularDamping * kin.rotation) * dt;
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
    // align radii/time for fallback
    angularTargetRadius:
      (o.components.AlignSteering as AlignSteeringComponent)
        ?.angularTargetRadius ?? 0.05,
    angularSlowRadius:
      (o.components.AlignSteering as AlignSteeringComponent)
        ?.angularSlowRadius ?? 0.6,
    angularTimeToTarget:
      (o.components.AlignSteering as AlignSteeringComponent)
        ?.angularTimeToTarget ?? 0.1,
  };
}
