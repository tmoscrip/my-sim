import { addComponent, createObject, type EntityId } from "../world-object";
import type { EntityFactory } from "./types";

export const WaterResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 100) => {
    var o = createObject(entityId);

    const x = 200 + Math.random() * 600;
    const y = 200 + Math.random() * 600;
    addComponent(o, "Position", { x: x, y: y });
    addComponent(o, "Render2D", { radius: radius, colour: "blue" });
    addComponent(o, "WaterProvider", { radius: radius, value: 50 });
    return o;
  },
};
