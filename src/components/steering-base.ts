import type { Vec2 } from "../math";

// Optional per-steering hints common across behaviors
export type SteeringHints = {
  enabled?: boolean;
  weight?: number; // for weighted blend
  priority?: number; // for priority blend
  debugColor?: string; // for overlays
  name?: string; // label
};

export type SteeringOutput = {
  linear: Vec2; // px/s^2
  angular: number; // rad/s^2
} & SteeringHints;

export type SteeringContext = {
  dt: number;
  world: { width: number; height: number };
};

export type SteeringEvaluator<C> = (
  o: any,
  comp: C & SteeringHints,
  ctx: SteeringContext
) => SteeringOutput | null;
