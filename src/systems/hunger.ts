import type { WorldObject } from "../world-object";

export function hungerSystem(objs: WorldObject[], dt: number) {
  for (const o of objs) {
    const hunger = o.components.Hunger;
    if (!hunger) continue;

    // Update hunger value based on the elapsed time
    hunger.value = Math.max(0, hunger.value - hunger.rate * dt);
  }
}
