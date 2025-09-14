import { hasAll, type WorldObject } from "../world-object";

export function feedingSystem(objs: WorldObject[], dt: number) {
  for (const o of objs) {
    if (!hasAll(o, "Hunger", "Position")) continue;

    // get all food providers
    const foodProviders = objs.filter((obj) =>
      hasAll(obj, "FoodProvider", "Position")
    );

    // for each food provider, if we're in range, eat some food
    const hunger = o.components.Hunger;
    const pos = o.components.Position;

    for (const fp of foodProviders) {
      const fpPos = fp.components.Position;
      const fpComp = fp.components.FoodProvider;
      if (!fpPos || !fpComp) continue;

      const dx = fpPos.x - pos.x;
      const dy = fpPos.y - pos.y;
      const distSq = dx * dx + dy * dy;
      const rangeSq = fpComp.radius * fpComp.radius;

      if (distSq <= rangeSq) {
        // in range to eat
        const eatAmount = fpComp.value * dt;
        hunger.value = Math.min(hunger.max, hunger.value + eatAmount);
        // Optionally, you could also reduce the food provider's available food here
      }
    }
  }
}
