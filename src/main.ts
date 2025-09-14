import { getRandomGrey } from "./helpers";
import { renderObjects } from "./render";
import { motionSystem } from "./systems";
import { addComponent, createObject, type WorldObject } from "./world-object";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const objects: WorldObject[] = [];
let nextId = 1;

const seedCount = 30;
for (let i = 0; i < seedCount; i++) {
  const o = createObject(nextId++);
  addComponent(o, "Position", {
    x: 200 + Math.random() * 600,
    y: 200 + Math.random() * 600,
  });
  addComponent(o, "Render2D", {
    radius: 30 + Math.random() * 30,
    colour: getRandomGrey(),
  });
  addComponent(o, "Velocity", {
    x: -100 + Math.random() * 200,
    y: -100 + Math.random() * 200,
  });
  objects.push(o);
}

console.log("Added " + objects.length + " components");

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
