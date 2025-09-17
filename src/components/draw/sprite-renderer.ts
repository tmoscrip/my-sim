export type AssetDetails = {
  path: string;
  xOffsetPx: number;
  yOffsetPx: number;
};

export type SpriteRendererComponent = {
  asset: AssetDetails;
  scaleMultiplier?: number;
  rotationOffset?: number;
  staticRotation?: boolean; // If true, ignores object orientation
};

import { WorldConfig } from "../../config";
import { getAssetSync } from "../../render";
import type { WorldObject } from "../../world-object";

/**
 * Renders SVG or image assets for a WorldObject with SpriteRenderer component
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  obj: WorldObject
): void {
  const pos = obj.components.Position;
  const spriteRenderer = obj.components.SpriteRenderer;

  if (!pos || !spriteRenderer) return;

  const img = getAssetSync(spriteRenderer.asset.path);
  if (!img) return; // Asset not loaded yet

  const sp = WorldConfig.worldToScreen(pos.x, pos.y);

  // Use radius from CanvasRenderer if available, otherwise default
  const radius = 40;
  const scaleMultiplier = spriteRenderer.scaleMultiplier ?? 1.0;
  const radiusPx = WorldConfig.scalarToPixels(radius) * scaleMultiplier;

  ctx.save();

  // Move to the object's screen position
  ctx.translate(sp.x, sp.y);

  // Apply rotation if not static
  if (!spriteRenderer.staticRotation) {
    const orientation = obj.components.Kinematics?.orientation ?? 0;
    const rotationOffset = spriteRenderer.rotationOffset ?? Math.PI;
    ctx.rotate(orientation + rotationOffset);
  }

  // Draw the image centered at origin with pixel radius sizing and offsets
  ctx.drawImage(
    img,
    -radiusPx + spriteRenderer.asset.xOffsetPx,
    -radiusPx + spriteRenderer.asset.yOffsetPx,
    radiusPx * 2,
    radiusPx * 2
  );

  ctx.restore();
}
