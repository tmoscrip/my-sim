import { addComponent, createObject, type EntityId } from "../world-object";
import type { EntityFactory } from "./types";

export const FoodResource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 200) => {
    var o = createObject(entityId);
    addComponent(o, "Position", { x: 400, y: 400 });
    addComponent(o, "Render2D", { radius: radius, colour: "green" });
    addComponent(o, "FoodProvider", { radius: radius, value: 20 });
    return o;
  },
};
