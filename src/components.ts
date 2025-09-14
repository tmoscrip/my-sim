export type Components = {
  Position: PositionComponent;
  Velocity: VelocityComponent;
  Render2D: Render2DComponent;
};

export type Vec2 = {
  x: number;
  y: number;
};

export type PositionComponent = Vec2;

export type VelocityComponent = Vec2;

export type Render2DComponent = {
  radius: number;
  colour: string;
};

export type ComponentKey = keyof Components;
