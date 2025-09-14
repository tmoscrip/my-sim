import { getRandomGrey } from "../helpers";
import { getAssetSync } from "../render";
import {
  addComponent,
  createObject,
  type EntityId,
  type WorldObject,
} from "../world-object";
import type { EntityFactory } from "./types";

function render(ctx: CanvasRenderingContext2D, o: WorldObject) {
  const pos = o.components.Position;
  const ren = o.components.Render2D;
  if (!pos || !ren) return;

  const heading = o.components.Motion?.heading ?? 0;

  if (ren.character) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(-1, -1); // Flip to correct orientation
    const characterFontSize = Math.max(10, Math.floor(ren.radius * 1.5));
    ctx.font = `${characterFontSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.rotate(heading);
    ctx.fillText(ren.character, 0, 0);
    ctx.restore();
  }

  if (ren.asset) {
    const r = ren.radius;
    const img = getAssetSync(ren.asset.path);
    if (img) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      // Avoid negative scale; rotate 180° if you need the same flip
      ctx.rotate(heading + Math.PI);
      // Center image at origin
      ctx.drawImage(
        img,
        -r + ren.asset.xOffsetPx,
        -r + ren.asset.yOffsetPx,
        r * 2,
        r * 2
      );
      ctx.restore();
    }
  }
}

export const Turtle: EntityFactory = {
  create: (entityId: EntityId) => {
    var o = createObject(entityId);

    addComponent(o, "Position", {
      x: 200 + Math.random() * 600,
      y: 200 + Math.random() * 600,
    });
    addComponent(o, "Render2D", {
      radius: 20 + Math.random() * 20,
      colour: getRandomGrey(),
      asset: {
        path: "turtle.svg",
        // TODO: Provide 0/0 defaults somewhere
        yOffsetPx: -12,
        xOffsetPx: 0,
      },
      render: render,
    });
    addComponent(o, "Clickable", {
      onClick: () => {
        o.debug = !o.debug;
      },
    });
    addComponent(o, "Motion", {
      heading: Math.random() * Math.PI * 2,
      speed: 50 + Math.random() * 150,
    });
    addComponent(o, "Behaviour", {
      mode: "Wander",
      timeInMode: 0, // TODO: Default initial value
      desiredSpeed: 40 + Math.random() * 100, // px/s
      turnRate: 4.0, // rad/s
      // seek tuning
      arriveDistance: 8,
      slowRadius: 20,
      // wander tuning
      wanderTurnInterval: 0.5,
      wanderJitter: 0.25, // small nudge in radians
      reverseChance: 0.02, // ~2% per second
    });
    addComponent(o, "Needs", [
      {
        name: "Water",
        value: 80 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: 7,
        seekAtFraction: 0.2,
        satiatedAtFraction: 0.8,
      },
      {
        name: "Food",
        value: 80 + Math.random() * 20,
        min: 0,
        max: 100,
        lossPerSecond: 3,
        seekAtFraction: 0.3,
        satiatedAtFraction: 0.6,
      },
    ]);
    return o;
  },
};
