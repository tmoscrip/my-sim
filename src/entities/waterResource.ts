import { addComponent, createObject, type EntityId } from "../world-object";
import type { EntityFactory } from "./types";

export const WaterResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 100) => {
    var o = createObject(entityId);
    addComponent(o, "Position", { x: 800, y: 800 });
    addComponent(o, "Render2D", { radius: radius, colour: "blue" });
    addComponent(o, "WaterProvider", { radius: radius, value: 50 });
    return o;
  },
};
