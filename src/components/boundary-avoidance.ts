export type BoundaryAvoidanceComponent = {
  lookAhead?: number; // px
  buffer?: number; // px
  strength?: number; // px/s^2
  angularScale?: number; // unitless
  enabled?: boolean;
  weight?: number;
  priority?: number; // typically high, e.g., 100
  debugColor?: string;
};
