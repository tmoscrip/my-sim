import type { Vec2 } from "../math";
import type { SteeringOutput } from "./steering-base";

export type SteeringComponent = {
  linear: Vec2; // linear acceleration (world units per s^2)
  angular: number; // angular acceleration (rad/s^2)
  // Optional: per-frame contribution breakdown for debug overlays
  contributions?: SteeringOutput[];
};
