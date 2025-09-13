export type Components = {
  Position: PositionComponent;
  Velocity: VelocityComponent;
  Renderable: RenderableComponent;
};

export type PositionComponent = {
  x: number;
  y: number;
};

export type VelocityComponent = {
  vx: number;
  vy: number;
};

export type RenderableComponent = {
  radius: number;
  colour: string;
};

export type ComponentKey = keyof Components;
