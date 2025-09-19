import { WorldConfig } from "../config";
import { addComponent, createObject } from "../world-object";
import type { EntityFactory } from "./types";

export const Player: EntityFactory = {
  create: (entityId) => {
    const o = createObject(entityId);
    // Player entity might have components added later

    addComponent(o, "Position", {
      x: WorldConfig.world.width / 2,
      y: WorldConfig.world.height / 2,
    });
    addComponent(o, "EmojiRenderer", {
      character: "🧑",
      sizeMultiplier: 2.0,
    });
    addComponent(o, "Kinematics", {
      velocity: { x: 0, y: 0 },
      orientation: 0,
      rotation: 0,
    });
    addComponent(o, "PlayerControl", {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
    });
    addComponent(o, "SteeringOutput", {
      linear: { x: 0, y: 0 },
      angular: 0,
    });
    addComponent(o, "MovementLimits", {
      maxSpeed: 200,
      maxAcceleration: 400,
      maxRotation: 5.0,
      maxAngularAcceleration: 10.0,
      linearDamping: 4.0,
      angularDamping: 0.9,
      dampingMode: "Friction",
    });

    return o;
  },
};
