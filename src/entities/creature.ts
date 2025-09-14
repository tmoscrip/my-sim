import { getRandomGrey } from "../helpers";
import { addComponent, createObject, type EntityId } from "../world-object";
import type { EntityFactory } from "./types";

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
      desiredSpeed: 40 + Math.random() * 100, // px/s
      turnRate: 4.0, // rad/s
      // seek tuning
      arriveDistance: 8,
      slowRadius: 60,
      // wander tuning
      wanderTurnInterval: 0.5,
      wanderJitter: 0.25, // small nudge in radians
      reverseChance: 0.02, // ~2% per second
    });
    addComponent(o, "Hunger", {
      value: 80 + Math.random() * 20,
      min: 0,
      max: 100,
      lossPerSecond: 6,
    });
    addComponent(o, "Thirst", {
      value: 80 + Math.random() * 20,
      min: 0,
      max: 100,
      lossPerSecond: 5,
    });
    return o;
  },
};
