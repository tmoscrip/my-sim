export type EmojiRendererComponent = {
  character: string;
  color?: string;
  fontFamily?: string;
  sizeMultiplier?: number;
};

import { WorldConfig } from "../../config";
import type { WorldObject } from "../../world-object";

/**
 * Renders emoji or text characters for a WorldObject with EmojiRenderer component
 */
export function drawEmoji(
  ctx: CanvasRenderingContext2D,
  obj: WorldObject
): void {
  const pos = obj.components.Position;
  const emojiRenderer = obj.components.EmojiRenderer;

  if (!pos || !emojiRenderer) return;

  const orientation = obj.components.Kinematics?.orientation ?? 0;
  const sp = WorldConfig.worldToScreen(pos.x, pos.y);

  // Use radius from CanvasRenderer if available, otherwise default
  const radiusPx = WorldConfig.scalarToPixels(50);

  ctx.save();

  // Move to the object's screen position
  ctx.translate(sp.x, sp.y);

  // Calculate font size based on object radius and multiplier
  const sizeMultiplier = emojiRenderer.sizeMultiplier ?? 1.5;
  const characterFontSize = Math.max(10, Math.floor(radiusPx * sizeMultiplier));

  // Set up font and alignment
  const fontFamily =
    emojiRenderer.fontFamily ?? "-apple-system, system-ui, sans-serif";
  ctx.font = `${characterFontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = emojiRenderer.color ?? "white";

  // Apply rotation based on object orientation
  ctx.rotate(orientation);

  // Draw the character
  ctx.fillText(emojiRenderer.character, 0, 0);

  ctx.restore();
}
