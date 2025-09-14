import type { WorldObject } from "../world-object";

export function thirstSystem(objs: WorldObject[], dt: number) {
  for (const o of objs) {
    const thirst = o.components.Thirst;
    if (!thirst) continue;

    // Update thirst value based on elapsed time (depletes over time)
    thirst.value = Math.max(0, thirst.value - thirst.rate * dt);
  }
}
