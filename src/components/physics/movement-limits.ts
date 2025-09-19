export type MovementLimitsComponent = {
  // Linear caps
  maxSpeed: number; // px/s
  maxAcceleration: number; // px/s^2
  // Angular caps
  maxRotation: number; // rad/s
  maxAngularAcceleration: number; // rad/s^2

  linearDamping?: number; // per second
  angularDamping?: number; // per second

  dampingMode?: "Drag" | "Friction" | "Hybrid"; // default: Hybrid
};
