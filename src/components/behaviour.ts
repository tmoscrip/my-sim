import type { Resources } from "./passive-resource-provider";

export type BehaviourComponent =
  | { mode: "Idle" }
  | {
      mode: "Wander";
      // internal wander state
      wanderAngle?: number; // radians
    }
  | {
      mode: "Seek";
      targetId: number;
      seekingNeed?: Resources; // which need we're currently pursuing
    };
