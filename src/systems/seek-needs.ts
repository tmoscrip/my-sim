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

    // Find first provider of that need
    const providers = query(objs, "PassiveResourceProvider", "Position").filter(
      (p) => p.components.PassiveResourceProvider.provides.includes(nowWants)
    );
    if (providers.length === 0) continue;

    const targetProvider = providers[0];

    const beh = seeker.components.Behaviour;
    beh.target = targetProvider.components.Position!;
    beh.mode = "Seek";
  }
}
