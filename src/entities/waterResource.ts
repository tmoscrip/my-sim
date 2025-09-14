import {
  addComponent,
  createObject,
  type EntityId,
  type WorldObject,
} from "../world-object";
import type { EntityFactory } from "./types";

function render(ctx: CanvasRenderingContext2D, o: WorldObject) {
  const pos = o.components.Position;
  const ren = o.components.Render2D;
  if (!pos || !ren) return;

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
}

export const WaterResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 100) => {
    var o = createObject(entityId);

    const x = 200 + Math.random() * 600;
    const y = 200 + Math.random() * 600;
    addComponent(o, "Position", { x: x, y: y });
    addComponent(o, "Render2D", {
      radius: radius,
      colour: "blue",
      render: render,
    });
    addComponent(o, "WaterProvider", { radius: radius, value: 50 });
    return o;
  },
};
