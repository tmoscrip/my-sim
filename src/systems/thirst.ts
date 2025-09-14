import { query, type WorldObject } from "../world-object";

export function thirstSystem(objs: WorldObject[], dt: number) {
  const drinkers = query(objs, "Thirst", "Position");
  for (const o of drinkers) {
    const thirst = o.components.Thirst;
    if (!thirst) continue;

    // Update thirst value based on elapsed time (depletes over time)
    thirst.value = Math.max(0, thirst.value - thirst.lossPerSecond * dt);
  }
}
