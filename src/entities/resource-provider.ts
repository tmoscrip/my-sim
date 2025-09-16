import {
  addComponent,
  createObject,
  type EntityId,
  type WorldObject,
} from "../world-object";
import type { EntityFactory } from "./types";
import { WorldConfig } from "../config";

function render(ctx: CanvasRenderingContext2D, o: WorldObject) {
  const pos = o.components.Position;
  const ren = o.components.Render2D;
  if (!pos || !ren) return;

  const sp = WorldConfig.worldToScreen(pos.x, pos.y);
  const rPx = WorldConfig.scalarToPixels(ren.radius);

  ctx.beginPath();
  ctx.arc(sp.x, sp.y, rPx, 0, Math.PI * 2);
  ctx.fillStyle = ren.colour;
  ctx.fill();

  ctx.strokeStyle = "black";
  ctx.lineWidth = 5;
  ctx.stroke();
}

export const FoodResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 50) => {
    var o = createObject(entityId);

    const margin = Math.max(20, radius + 10);
    const x = margin + Math.random() * (WorldConfig.world.width - 2 * margin);
    const y = margin + Math.random() * (WorldConfig.world.height - 2 * margin);
    addComponent(o, "Position", { x: x, y: y });
    addComponent(o, "Render2D", {
      radius: radius,
      colour: "green",
      render: render,
    });
    addComponent(o, "PassiveResourceProvider", {
      provides: ["Food"],
      radius: radius,
      providedPerSecond: 40,
    });
    return o;
  },
};

export const WaterResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 50) => {
    var o = createObject(entityId);

    const margin = Math.max(20, radius + 10);
    const x = margin + Math.random() * (WorldConfig.world.width - 2 * margin);
    const y = margin + Math.random() * (WorldConfig.world.height - 2 * margin);
    addComponent(o, "Position", { x: x, y: y });
    addComponent(o, "Render2D", {
      radius: radius,
      colour: "blue",
      render: render,
    });
    addComponent(o, "PassiveResourceProvider", {
      provides: ["Water"],
      radius: radius,
      providedPerSecond: 50,
    });
    return o;
  },
};
