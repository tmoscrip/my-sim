import { Creature, Resource } from "./entity-types";
import { renderObjects } from "./render";
import { motionSystem } from "./systems/motion";
import { type WorldObject } from "./world-object";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const objects: WorldObject[] = [];
let nextId = 1;

const seedCount = 5;
for (let i = 0; i < seedCount; i++) {
  objects.push(Creature.create(nextId++));
}

objects.push(Resource.create(nextId++));

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000); // clamp
  last = now;

  motionSystem(objects, dt, 1000, 1000);
  renderObjects(ctx, objects);

  requestAnimationFrame(loop);
}

loop();
