import { addComponent, createObject, type EntityId } from "../world-object";
import type { EntityFactory } from "./types";
import { WorldConfig } from "../config";

export const Turtle: EntityFactory = {
  create: (entityId: EntityId) => {
    var o = createObject(entityId);

    const spawnMargin = 80;
    const xMin = spawnMargin;
    const yMin = spawnMargin;
    const xMax = WorldConfig.world.width - spawnMargin;
    const yMax = WorldConfig.world.height - spawnMargin;
    addComponent(o, "Position", {
      x: xMin + Math.random() * Math.max(0, xMax - xMin),
      y: yMin + Math.random() * Math.max(0, yMax - yMin),
    });

    addComponent(o, "SpriteRenderer", {
      asset: {
        path: "turtle.svg",
        xOffsetPx: 0,
        yOffsetPx: -12,
      },
    });

    addComponent(o, "Kinematics", {
      velocity: { x: 0, y: 0 },
      orientation: 0,
      rotation: 0,
    });
    addComponent(o, "SteeringOutput", {
      linear: { x: 0, y: 0 },
      angular: 0,
    });
    // addComponent(o, "Clickable", {
    //   onClick: () => {
    //     o.debug = !o.debug;
    //   },
    // });
    addComponent(o, "MovementLimits", {
      maxSpeed: 200,
      maxAcceleration: 200,
      maxRotation: 23.0,
      maxAngularAcceleration: 10.0,
      linearDamping: 1.8,
    });
    addComponent(o, "Behaviour", { mode: "Wander" });
    // addComponent(o, "FleeFromPlayer", {
    //   safeDistance: 500,
    // });
    addComponent(o, "KinematicSeek", {
      maxSpeed: 2 + Math.random(),
      arriveRadius: 10,
      timeToTarget: 0.1,
    });
    // addComponent(o, "Needs", [
    //   {
    //     name: "Water",
    //     value: 80 + Math.random() * 20,
    //     min: 0,
    //     max: 100,
    //     lossPerSecond: 5 + Math.random() * 3,
    //     seekAtFraction: 0.2,
    //     satiatedAtFraction: 0.9,
    //   },
    //   {
    //     name: "Food",
    //     value: 40 + Math.random() * 20,
    //     min: 0,
    //     max: 100,
    //     lossPerSecond: 2 + Math.random() * 2,
    //     seekAtFraction: 0.3,
    //     satiatedAtFraction: 0.9,
    //   },
    // ]);
    return o;
  },
};
