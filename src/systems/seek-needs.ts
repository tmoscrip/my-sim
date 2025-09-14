import type { Resources } from "../components/passive-resource-provider";
import { query, type WorldObject } from "../world-object";

export function seeksNeedsSystem(objs: WorldObject[], dt: number) {
  const seekers = query(objs, "Needs", "Position", "Behaviour");

  for (const seeker of seekers) {
    const required: Resources[] = [];
    for (const need of seeker.components.Needs) {
      if (need.value >= need.max * need.seekAtFraction) continue;
      required.push(need.name);
    }

    if (required.length === 0) continue;
    // TODO: Consider multiple needs sensibly
    var nowWants = required[0];

    const providers = query(objs, "PassiveResourceProvider", "Position").filter(
      (p) => p.components.PassiveResourceProvider.provides.includes(nowWants)
    );
    if (providers.length === 0) continue;

    // Find nearest provider
    providers.sort((a, b) => {
      const aPos = a.components.Position!;
      const bPos = b.components.Position!;
      const sPos = seeker.components.Position!;
      const aDist2 =
        (aPos.x - sPos.x) * (aPos.x - sPos.x) +
        (aPos.y - sPos.y) * (aPos.y - sPos.y);
      const bDist2 =
        (bPos.x - sPos.x) * (bPos.x - sPos.x) +
        (bPos.y - sPos.y) * (bPos.y - sPos.y);
      return aDist2 - bDist2;
    });
    const targetProvider = providers[0];

    const beh = seeker.components.Behaviour;
    beh.target = targetProvider.components.Position!;
    beh.mode = "Seek";
    beh.timeInMode = 0;
  }
}
