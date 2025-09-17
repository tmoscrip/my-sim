import type { Resources } from "../components/behaviour/passive-resource-provider";
import { query, type WorldObject } from "../world-object";

export function seeksNeedsSystem(objs: WorldObject[], _dt: number) {
  const seekers = query(objs, "Needs", "Position", "Behaviour");

  for (const seeker of seekers) {
    // If already seeking and the specific sought need is satiated, revert to Wander
    if (seeker.components.Behaviour.mode === "Seek") {
      const beh = seeker.components.Behaviour;

      // Determine whether the currently sought need is satiated
      const sought = beh.seekingNeed;
      const needs = seeker.components.Needs;
      const soughtNeed = sought
        ? needs.find((n) => n.name === sought)
        : undefined;

      const soughtIsSatiated = soughtNeed
        ? soughtNeed.value >= soughtNeed.max * soughtNeed.satiatedAtFraction
        : false;

      // Ensure all other needs are not below their seekAtFraction (otherwise keep seeking)
      const othersOk = needs.every((n) =>
        sought && n.name === sought ? true : n.value >= n.max * n.seekAtFraction
      );

      if (soughtIsSatiated && othersOk) {
        seeker.components.Behaviour = {
          mode: "Wander",
          wanderAngle: Math.random() * 2 - 1,
        };

        const kin = seeker.components.Kinematics;
        if (kin && kin.velocity) {
          kin.velocity.x *= 0.35;
          kin.velocity.y *= 0.35;
        }
        continue;
      }
    }

    // Determine which needs require attention
    const required: Resources[] = [];
    for (const need of seeker.components.Needs) {
      if (need.value >= need.max * need.seekAtFraction) continue;
      required.push(need.name);
    }

    if (required.length === 0) continue;
    const nowWants = required[0];

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

    seeker.components.Behaviour = {
      mode: "Seek",
      targetId: targetProvider.id,
      seekingNeed: nowWants,
    };
  }
}
