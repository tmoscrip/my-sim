export type WanderSteeringComponent = {
  radius: number;
  distance: number;
  jitter: number; // rad/s
  timeToTarget: number; // s
  decayPerSec?: number; // 1/s
  maxArc?: number; // rad
  cruiseSpeed?: number; // px/s
  // internal state (optional) specific to wander
  angle?: number; // rad
  enabled?: boolean;
  weight?: number;
  priority?: number;
  debugColor?: string;
};
