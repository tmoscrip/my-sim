export type ArriveSteeringComponent = {
  targetId?: number;
  targetRadius: number; // px
  slowRadius: number; // px
  timeToTarget: number; // s
  enabled?: boolean;
  weight?: number;
  priority?: number;
  debugColor?: string;
};
