import { query, type WorldObject } from "./world-object";

export function renderObjects(
  ctx: CanvasRenderingContext2D,
  objs: WorldObject[]
) {
  ctx.clearRect(0, 0, 1000, 1000);

  const renderables = query(objs, "Position", "Render2D");
  for (const o of renderables) {
    const pos = o.components.Position;
    const ren = o.components.Render2D;

    o.components.Render2D.render(ctx, o);

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
      ctx.strokeStyle = "red";
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

    const hun = o.components.Hunger;
    if (hun) {
      ctx.save();
      const barWidth = ren.radius * 2;
      const barHeight = 8;
      const barX = pos.x - barWidth / 2;
      const barY = pos.y + ren.radius + 4;

      // Background
      ctx.fillStyle = "black";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Foreground
      const hungerPercent = hun.value / 100;
      ctx.fillStyle = "green";
      ctx.fillRect(barX, barY, barWidth * hungerPercent, barHeight);

      // Percent label
      const label = Math.round(hun.value).toString();
      ctx.font = `10px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(label, pos.x, barY + barHeight / 2);
      ctx.restore();
    }

    // Thirst bar under Hunger
    const thi = o.components.Thirst;
    if (thi) {
      ctx.save();
      const barWidth = ren.radius * 2;
      const barHeight = 8;
      const barX = pos.x - barWidth / 2;
      const baseY = pos.y + ren.radius + 4;
      const barY = baseY + (hun ? barHeight + 2 : 0);

      // Background
      ctx.fillStyle = "black";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Foreground
      const thirstPercent = thi.value / 100;
      ctx.fillStyle = "blue";
      ctx.fillRect(barX, barY, barWidth * thirstPercent, barHeight);

      // Percent label
      const label = Math.round(thi.value).toString();
      ctx.font = `10px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(label, pos.x, barY + barHeight / 2);
      ctx.restore();
    }

    const beh = o.components.Behaviour;
    if (beh && beh.mode) {
      ctx.save();
      const label = beh.mode;
      // place under id label
      ctx.font = `${Math.max(
        8,
        Math.floor(ren.radius * 0.2)
      )}px -apple-system, system-ui, sans-serif`;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.strokeText(label, pos.x, pos.y + ren.radius / 2);
      ctx.fillStyle = "white";
      ctx.fillText(label, pos.x, pos.y + ren.radius / 2);
      ctx.restore();
    }
  }
}
