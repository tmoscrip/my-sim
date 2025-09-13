import type { WorldObject } from "./world-object";

export function renderObjects(
  ctx: CanvasRenderingContext2D,
  objs: WorldObject[]
) {
  ctx.clearRect(0, 0, 1000, 1000);
  for (const o of objs) {
    const pos = o.components.Position;
    const ren = o.components.Renderable;
    if (!pos || !ren) {
      continue;
    }
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ren.radius, 0, Math.PI * 2);
    ctx.fillStyle = ren.colour;
    ctx.fill();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}
