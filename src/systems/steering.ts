import type { WorldObject } from "../world-object";
import { query } from "../world-object";
import { vec, type Vec2 } from "../math";

type SteeringOutput = {
  linear: Vec2;
  angular: number;
};

function getSteering(o: WorldObject): SteeringOutput {
  const wanderForce = vec.make(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  );
  vec.normalize(wanderForce, wanderForce);

  // if outside world bounds, steer back in
  const pos = o.components.Position!;
  const worldSize = 1000;
  const margin = 30;
  const turnForce = 1;
  if (pos.x < margin) {
    vec.add(wanderForce, vec.scale(vec.make(1, 0), turnForce), wanderForce);
  }
  if (pos.x > worldSize - margin) {
    vec.add(wanderForce, vec.scale(vec.make(-1, 0), turnForce), wanderForce);
  }
  if (pos.y < margin) {
    vec.add(wanderForce, vec.scale(vec.make(0, 1), turnForce), wanderForce);
  }
  if (pos.y > worldSize - margin) {
    vec.add(wanderForce, vec.scale(vec.make(0, -1), turnForce), wanderForce);
  }

  return { linear: vec.scale(wanderForce, 1000), angular: 0 };
}

export function updateKinematicsSystem(objs: WorldObject[], dt: number) {
  const movers = query(objs, "Position", "Kinematics");
  for (const o of movers) {
    const kin = o.components.Kinematics;
    const pos = o.components.Position;

    // should this be a system that runs before kinematics?
    const steering = getSteering(o);

    kin.velocity.x += steering.linear.x * dt;
    kin.velocity.y += steering.linear.y * dt;

    pos.x += kin.velocity.x * dt;
    pos.y += kin.velocity.y * dt;

    kin.orientation += kin.rotation * dt;
    kin.rotation += steering.angular * dt;

    // clamp speed
    const speed = vec.length(kin.velocity);
    if (speed > 100) {
      vec.scale(kin.velocity, 100 / speed, kin.velocity);
    }
  }
}
