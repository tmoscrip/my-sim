import { query, type WorldObject } from "../world-object";

export function hungerSystem(objs: WorldObject[], dt: number) {
  const eaters = query(objs, "Hunger", "Position");
  for (const o of eaters) {
    const hunger = o.components.Hunger;
    if (!hunger) continue;

    // Update hunger value based on the elapsed time
    hunger.value = Math.max(0, hunger.value - hunger.lossPerSecond * dt);
  }
}
