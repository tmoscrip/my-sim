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
    addComponent(o, "Clickable", {
      onClick: () => {
        o.debug = !o.debug;
      },
    });
    addComponent(o, "MovementLimits", {
      maxSpeed: 110,
      maxAcceleration: 900,
      maxRotation: 5.0,
      maxAngularAcceleration: 10.0,
    });
    addComponent(o, "WanderSteering", {
      radius: 108,
      distance: 60,
      jitter: 4.4,
      timeToTarget: 0.25,
      decayPerSec: 2.0,
      maxArc: 1.2,
      cruiseSpeed: 110,
      weight: 1,
      priority: 10,
      debugColor: "#FF4DFF",
    });
    addComponent(o, "ArriveSteering", {
      targetRadius: 6,
      slowRadius: 40,
      timeToTarget: 0.25,
      weight: 1,
      priority: 20,
      debugColor: "#66FF66",
    });
    addComponent(o, "AlignSteering", {
      maxRotation: 5.0,
      maxAngularAcceleration: 10.0,
      angularTargetRadius: 0.05,
      angularSlowRadius: 0.6,
      angularTimeToTarget: 0.1,
    });
    addComponent(o, "BoundaryAvoidance", {
      buffer: 30,
      strength: 4900,
      angularScale: 23.6,
      priority: 200,
      lookAhead: 80,
      debugColor: "#AA66FF",
    });
    addComponent(o, "Behaviour", { mode: "Wander" });
    addComponent(o, "Needs", [
      {
        name: "Water",
        value: 80 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: 5 + Math.random() * 3,
        seekAtFraction: 0.2,
        satiatedAtFraction: 0.9,
      },
      {
        name: "Food",
        value: 40 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: 2 + Math.random() * 2,
        seekAtFraction: 0.3,
        satiatedAtFraction: 0.9,
      },
    ]);
    return o;
  },
};
