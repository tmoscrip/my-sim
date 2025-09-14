import type { WorldObject } from "../world-object";

export type Render2DComponent = {
  // Circle renderer
  radius: number;
  colour: string;

  // Character renderer
  character?: string;

  render: (ctx: CanvasRenderingContext2D, obj: WorldObject) => void;
};
