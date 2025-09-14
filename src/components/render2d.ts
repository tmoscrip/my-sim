import type { WorldObject } from "../world-object";

export type AssetDetails = {
  path: string;
  xOffsetPx?: number;
  yOffsetPx?: number;
};

export type Render2DComponent = {
  // Circle renderer
  radius: number;
  colour: string;

  // Character renderer, very slow
  character?: string;

  // SVG renderer
  asset?: AssetDetails;

  render: (ctx: CanvasRenderingContext2D, obj: WorldObject) => void;
};
