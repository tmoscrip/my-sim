import { query, type WorldObject } from "../world-object";

export function needsSystem(objs: WorldObject[], dt: number) {
  const withNeeds = query(objs, "Needs", "Position");
  for (const o of withNeeds) {
    const needs = o.components.Needs;
    if (!needs) continue;

    // Update needs values based on elapsed time (depletes over time)
    for (const need of needs) {
      need.value = Math.max(0, need.value - need.lossPerSecond * dt);
    }
  }
}
