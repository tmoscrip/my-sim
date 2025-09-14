import { world } from "../main";
import {
  type EntityId,
  createObject,
  addComponent,
  query,
} from "../world-object";
import type { EntityFactory } from "./types";

export const PointerHighlight: EntityFactory = {
  create: (entityId: EntityId) => {
    const pointerInput = createObject(entityId);
    addComponent(pointerInput, "PointerInput", {
      isDown: false,
      onClick: (x, y) => {
        query(world.objects, "Clickable", "Render2D", "Position").forEach(
          (p) => {
            const pos = p.components.Position;
            const ren = p.components.Render2D;
            // if click happened inside radius, call onClick
            const dx = pos.x - x;
            const dy = pos.y - y;
            if (dx * dx + dy * dy <= ren.radius * ren.radius) {
              p.components.Clickable?.onClick();
            }
          }
        );
      },
    });
    addComponent(pointerInput, "Position", { x: 0, y: 0 });
    addComponent(pointerInput, "Render2D", {
      radius: 5,
      colour: "lime",
      render: (ctx, obj) => {
        const pos = obj.components.Position!;
        const poi = obj.components.PointerInput!;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = obj.components.Render2D!.colour;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (poi.isDown) {
          ctx.fillStyle = "rgba(0,255,0,0.3)";
          ctx.fill();
        }
        ctx.restore();
      },
    });
    return pointerInput;
  },
};
