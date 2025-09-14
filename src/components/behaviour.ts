import type { Vec2 } from "../types";

export type BehaviourMode = "Idle" | "Wander" | "Seek";
export type BehaviourComponent = {
  mode: BehaviourMode;
  timeInMode: number;

  // generic steering knobs
  desiredSpeed: number; // cruise px/s
  turnRate: number; // rad/s max turn rate

  // seek
  target?: Vec2;
  arriveDistance?: number; // px to consider arrived and stop
  slowRadius?: number; // px within which to slow down

  // wander
  wanderTurnInterval?: number; // seconds between small heading jitters
  wanderJitter?: number; // radians per jitter
  reverseChance?: number; // chance per second to flip 180°
};
