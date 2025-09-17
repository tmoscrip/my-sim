import type { WorldObject } from "../../world-object";
import { drawEmoji } from "./emoji-renderer";
import { drawSprite } from "./sprite-renderer";

/**
 * A composite render function that automatically handles all renderer components
 * attached to a WorldObject. Renders in order: Canvas -> Sprite -> Emoji
 */
export function renderMultiple(
  ctx: CanvasRenderingContext2D,
  obj: WorldObject
): void {
  if (obj.components.CanvasRenderer?.render) {
    obj.components.CanvasRenderer.render(ctx, obj);
  }

  drawSprite(ctx, obj);

  drawEmoji(ctx, obj);
}
