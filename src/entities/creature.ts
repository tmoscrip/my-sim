import { getRandomGrey } from "../helpers";
import { getAssetSync } from "../render";
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

  const orientation = o.components.Kinematics?.orientation ?? 0;
  const sp = WorldConfig.worldToScreen(pos.x, pos.y);
  const rPx = WorldConfig.scalarToPixels(ren.radius);

  if (ren.character) {
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.scale(-1, -1); // Flip to correct orientation
    const characterFontSize = Math.max(10, Math.floor(rPx * 1.5));
    ctx.font = `${characterFontSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.rotate(orientation);
    ctx.fillText(ren.character, 0, 0);
    ctx.restore();
  }

  if (ren.asset) {
    const img = getAssetSync(ren.asset.path);
    if (img) {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(orientation + Math.PI);
      // Center image at origin using pixel radius
      ctx.drawImage(
        img,
        -rPx + ren.asset.xOffsetPx,
        -rPx + ren.asset.yOffsetPx,
        rPx * 2,
        rPx * 2
      );
      ctx.restore();
    }
  }
}

export const Turtle: EntityFactory = {
  create: (entityId: EntityId) => {
    // Determine turtle personality type (randomly)
    const personality = Math.floor(Math.random() * 1); // 0, 1, or 2

    var o = createObject(entityId);

    // Spawn within world bounds with a margin
    const spawnMargin = 80;
    const xMin = spawnMargin;
    const yMin = spawnMargin;
    const xMax = WorldConfig.world.width - spawnMargin;
    const yMax = WorldConfig.world.height - spawnMargin;
    addComponent(o, "Position", {
      x: xMin + Math.random() * Math.max(0, xMax - xMin),
      y: yMin + Math.random() * Math.max(0, yMax - yMin),
    });

    // Size based on personality: fast=smaller, slow=larger
    const baseRadius = personality === 0 ? 15 : personality === 1 ? 25 : 20;

    addComponent(o, "Render2D", {
      radius: baseRadius + Math.random() * 10,
      colour: getRandomGrey(),
      asset: {
        path: "turtle.svg",
        // TODO: Provide 0/0 defaults somewhere
        yOffsetPx: -12,
        xOffsetPx: 0,
      },
      render: render,
    });
    addComponent(o, "Kinematics", {
      velocity: { x: 0, y: 0 },
      orientation: 0,
      rotation: 0,
    });
    // Add steering component for accumulating forces
    addComponent(o, "Steering", {
      linear: { x: 0, y: 0 },
      angular: 0,
    });
    addComponent(o, "Clickable", {
      onClick: () => {
        o.debug = !o.debug;
      },
    });

    // Movement limits shared by all steering behaviors
    addComponent(o, "MovementLimits", {
      maxSpeed: 110,
      maxAcceleration: 900,
      maxRotation: 5.0,
      maxAngularAcceleration: 10.0,
    });

    // Wander behavior params
    addComponent(o, "WanderSteering", {
      radius: 108,
      distance: 0,
      jitter: 4.4,
      timeToTarget: 0.25,
      decayPerSec: 2.0,
      maxArc: 1.2,
      cruiseSpeed: 110,
      weight: 1,
      priority: 10,
      debugColor: "#FF4DFF",
    });

    // Arrive/Seek behavior params
    addComponent(o, "ArriveSteering", {
      targetRadius: 6,
      slowRadius: 40,
      timeToTarget: 0.25,
      weight: 1,
      priority: 20,
      debugColor: "#66FF66",
    });

    // Align steering params for angular control (used by evaluators)
    addComponent(o, "AlignSteering", {
      maxRotation: 5.0,
      maxAngularAcceleration: 10.0,
      angularTargetRadius: 0.05,
      angularSlowRadius: 0.6,
      angularTimeToTarget: 0.1,
    });

    // Boundary avoidance (predictive) params
    addComponent(o, "BoundaryAvoidance", {
      buffer: 30,
      strength: 4900,
      angularScale: 23.6,
      priority: 200,
      lookAhead: 80,
      debugColor: "#AA66FF",
    });

    // Behaviour now carries only mode/state
    addComponent(o, "Behaviour", { mode: "Wander" });

    // Configure needs based on personality type (unchanged)
    const waterLossRate = personality === 0 ? 9 : personality === 1 ? 5 : 7;
    const foodLossRate = personality === 0 ? 4 : personality === 1 ? 2 : 3;

    addComponent(o, "Needs", [
      {
        name: "Water",
        value: 80 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: waterLossRate,
        seekAtFraction: 0.2,
        satiatedAtFraction: 0.9,
      },
      {
        name: "Food",
        value: 40 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: foodLossRate,
        seekAtFraction: 0.3,
        satiatedAtFraction: 0.9,
      },
    ]);
    return o;
  },
};
