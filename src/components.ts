export type Components = {
  Position: PositionComponent;
  Motion: MotionComponent;
  Render2D: Render2DComponent;
  Behaviour: BehaviourComponent;
};

export type Vec2 = {
  x: number;
  y: number;
};

export type PositionComponent = Vec2;

export type MotionComponent = {
  heading: number;
  speed: number;
};

export type Render2DComponent = {
  radius: number;
  colour: string;
};

export type BehaviourMode = "Idle" | "Wander" | "Seek";
export type BehaviourComponent = {
  mode: BehaviourMode;

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

export type ComponentKey = keyof Components;
