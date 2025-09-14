import type { WorldObject } from "./world-object";

export function renderObjects(
  ctx: CanvasRenderingContext2D,
  objs: WorldObject[]
) {
  ctx.clearRect(0, 0, 1000, 1000);
  for (const o of objs) {
    const pos = o.components.Position;
    const ren = o.components.Render2D;
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

    const idFontSize = Math.max(10, Math.floor(ren.radius * 0.8));
    ctx.font = `${idFontSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(o.id.toString(), pos.x, pos.y);

    // Debug: draw heading arrow and speed label if Motion exists
    const mot = o.components.Motion;
    if (mot) {
      ctx.save();
      const angle = mot.heading;
      const speed = mot.speed ?? 0;

      // Arrow length scales with speed but remains readable
      const arrowLen = ren.radius + Math.min(speed, 300) * 0.5;
      const sx = pos.x;
      const sy = pos.y;
      const ex = sx + Math.cos(angle) * arrowLen;
      const ey = sy + Math.sin(angle) * arrowLen;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      const headLen = Math.max(6, Math.min(12, ren.radius * 0.4));
      const left = angle + Math.PI - 0.5;
      const right = angle + Math.PI + 0.5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(left) * headLen, ey + Math.sin(left) * headLen);
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex + Math.cos(right) * headLen,
        ey + Math.sin(right) * headLen
      );
      ctx.stroke();

      // Speed label near arrow tip
      const label = Number.isFinite(speed) ? speed.toFixed(0) : "0";
      ctx.font = `12px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.strokeText(label, ex + 6, ey);
      ctx.fillStyle = "white";
      ctx.fillText(label, ex + 6, ey);

      ctx.restore();
    }
  }
}
