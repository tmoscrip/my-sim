import type { WaterProviderComponent } from "../components";
import { hasAll, type WorldObject } from "../world-object";

const THIRST_SEEK_FRACTION = 0.1;
const THIRST_SATIATED_FRACTION = 0.7;

export function drinkingSystem(objs: WorldObject[], dt: number) {
  // Collect all providers with positions
  const providers = objs.filter(
    (o) => o.components.WaterProvider && o.components.Position
  );

  for (const o of objs) {
    const thirst = o.components.Thirst;
    const pos = o.components.Position;
    if (!thirst || !pos) continue;

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
      // If within provider radius, drink from it
      const wp = nearest.components.WaterProvider!;
      const pPos = nearest.components.Position!;
      const dx = pPos.x - pos.x;
      const dy = pPos.y - pos.y;
      const d2 = dx * dx + dy * dy;
      const radius = wp.radius ?? 0;
      if (radius > 0 && d2 <= radius * radius && wp.value > 0) {
        const drinkRate = wp.value;
        const drink = Math.min(wp.value, drinkRate * dt);
        const max = thirst.max ?? 1;
        thirst.value = Math.min(max, thirst.value + drink);
      }
    }

    // Steering: seek if thirsty, wander otherwise
    const threshold = (thirst.max ?? 1) * THIRST_SEEK_FRACTION;
    const behaviour = o.components.Behaviour!;
    if (!behaviour) continue;

    if (thirst.value <= threshold && nearest) {
      const np = nearest.components.Position!;
      behaviour.mode = "Seek";
      behaviour.target = { x: np.x, y: np.y };
    }

    if (thirst.value >= (thirst.max ?? 1) * THIRST_SATIATED_FRACTION) {
      behaviour.mode = "Wander";
      if (behaviour.target) delete behaviour.target;
    }
  }
}
