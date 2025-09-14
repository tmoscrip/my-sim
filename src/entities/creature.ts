import { getRandomGrey } from "../helpers";
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

  const idFontSize = Math.max(8, Math.floor(ren.radius * 0.4));
  ctx.font = `${idFontSize}px -apple-system, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(o.id.toString(), pos.x, pos.y - ren.radius * 0.6);
}

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
      character: "🐢",
      render: render,
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
