import type { WorldObject } from "./world-object";
import { hasAll } from "./world-object";

export function motionSystem(
  objs: WorldObject[],
  dt: number,
  w = 800,
  h = 800
) {
  for (const o of objs) {
    if (hasAll(o, "Position", "Velocity")) {
      o.components.Position.x += o.components.Velocity.x * dt;
      o.components.Position.y += o.components.Velocity.y * dt;

      // bounce
      const r = o.components.Render2D?.radius ?? 0;
      if (o.components.Position.x < r || o.components.Position.x > w - r)
        o.components.Velocity.x *= -1;
      if (o.components.Position.y < r || o.components.Position.y > h - r)
        o.components.Velocity.y *= -1;
    }
  }
}
