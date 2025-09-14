export type Components = {
  Position: PositionComponent;
  Velocity: VelocityComponent;
  Render2D: Render2DComponent;
};

export type PositionComponent = {
  x: number;
  y: number;
};

export type VelocityComponent = {
  vx: number;
  vy: number;
};

export type Render2DComponent = {
  radius: number;
  colour: string;
};

export type ComponentKey = keyof Components;
