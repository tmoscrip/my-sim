import { getRandomGrey } from "./helpers";
import { addComponent, createObject, type EntityId } from "./world-object";

export type EntityFactory = {
  create: (entityId: EntityId) => ReturnType<typeof createObject>;
};

export const Creature: EntityFactory = {
  create: (entityId: EntityId) => {
    var o = createObject(entityId);
    addComponent(o, "Position", {
      x: 200 + Math.random() * 600,
      y: 200 + Math.random() * 600,
    });
    addComponent(o, "Render2D", {
      radius: 30 + Math.random() * 30,
      colour: getRandomGrey(),
    });
    addComponent(o, "Motion", {
      heading: Math.random() * Math.PI * 2,
      speed: 50 + Math.random() * 150,
    });
    addComponent(o, "Behaviour", {
      mode: "Wander",
      desiredSpeed: 80 + Math.random() * 60, // px/s
      turnRate: 2.0, // rad/s
      // seek tuning
      arriveDistance: 8,
      slowRadius: 120,
      // wander tuning
      wanderTurnInterval: 0.5,
      wanderJitter: 0.25, // small nudge in radians
      reverseChance: 0.02, // ~2% per second
    });
    addComponent(o, "Hunger", { value: 100, min: 0, max: 100, rate: 10 });
    return o;
  },
};

export const Resource: EntityFactory = {
  create: (entityId: EntityId, radius: number = 200) => {
    var o = createObject(entityId);
    addComponent(o, "Position", { x: 400, y: 400 });
    addComponent(o, "Render2D", { radius: radius, colour: "green" });
    addComponent(o, "FoodProvider", { radius: radius, value: 20 });
    return o;
  },
};
