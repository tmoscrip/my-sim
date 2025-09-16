import { query, type WorldObject } from "../world-object";

// Check if two positions are within a given squared radius
function inRange2(
  a: { x: number; y: number },
  b: { x: number; y: number },
  radius2: number
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= radius2;
}

export function consumeResourcesSystem(objs: WorldObject[], dt: number) {
  const providers = query(objs, "PassiveResourceProvider", "Position");
  const needers = query(objs, "Needs", "Position");

  for (const provider of providers) {
    const pr = provider.components.PassiveResourceProvider;
    const pPos = provider.components.Position!;
    const radius = pr.radius ?? 0;
    const radius2 = radius * radius;

    for (const needer of needers) {
      const nPos = needer.components.Position!;
      if (!inRange2(pPos, nPos, radius2)) continue;

      for (const need of needer.components.Needs) {
        if (!pr.provides.includes(need.name)) continue;
        if (need.value >= need.max) continue;

        const oldValue = need.value;
        need.value = Math.min(need.max, need.value + pr.providedPerSecond * dt);

        // Log significant increases for debugging
        if (
          need.value >= need.max * need.satiatedAtFraction &&
          oldValue < need.max * need.satiatedAtFraction
        ) {
          console.log(
            `Entity ${needer.id} ${
              need.name
            } reached satiation: ${need.value.toFixed(1)}/${
              need.max
            } from provider ${provider.id}`
          );
        }
      }
    }
  }
}
