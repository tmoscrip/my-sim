import { query, type WorldObject } from "../world-object";

const HUNGER_SEEK_FRACTION = 0.1;
const HUNGER_SATIATED_FRACTION = 0.9;

export function feedingSystem(objs: WorldObject[], dt: number) {
  const providers = query(objs, "FoodProvider", "Position");
  const eaters = query(objs, "Hunger", "Position", "Behaviour");

  for (const o of eaters) {
    const hunger = o.components.Hunger;
    const pos = o.components.Position;

    // Find nearest provider
    let nearest: WorldObject | undefined;
    let nearestDistSq = Infinity;
    for (const p of providers) {
      const pPos = p.components.Position!;
      const dx = pPos.x - pos.x;
      const dy = pPos.y - pos.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDistSq) {
        nearest = p;
        nearestDistSq = d2;
      }
    }

    if (nearest) {
      // If within provider radius, eat from it
      const fp = nearest.components.FoodProvider!;
      const pPos = nearest.components.Position!;
      const dx = pPos.x - pos.x;
      const dy = pPos.y - pos.y;
      const d2 = dx * dx + dy * dy;
      const radius = fp.radius ?? 0;
      if (radius > 0 && d2 <= radius * radius && fp.value > 0) {
        const feedRate = fp.value;
        const eat = Math.min(fp.value, feedRate * dt);
        const max = hunger.max ?? 1;
        hunger.value = Math.min(max, hunger.value + eat);
      }
    }

    // Steering: seek if hungry, wander otherwise
    const threshold = (hunger.max ?? 1) * HUNGER_SEEK_FRACTION;
    const behaviour = o.components.Behaviour!;

    if (hunger.value <= threshold && nearest) {
      const np = nearest.components.Position!;
      behaviour.mode = "Seek";
      behaviour.target = { x: np.x, y: np.y };
    }

    if (hunger.value >= (hunger.max ?? 1) * HUNGER_SATIATED_FRACTION) {
      behaviour.mode = "Wander";
      if (behaviour.target) delete behaviour.target;
    }
  }
}
