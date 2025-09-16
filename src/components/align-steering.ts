export type AlignSteeringComponent = {
  maxRotation: number; // rad/s
  maxAngularAcceleration: number; // rad/s^2
  angularTargetRadius: number; // rad
  angularSlowRadius: number; // rad
  angularTimeToTarget: number; // s
  enabled?: boolean;
  weight?: number;
  priority?: number;
  debugColor?: string;
};
