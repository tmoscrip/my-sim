import { Creature, FoodResource, WaterResource } from "./entities";
import { renderObjects } from "./render";
import { drinkingSystem } from "./systems/drinking";
import { feedingSystem } from "./systems/feeding";
import { hungerSystem } from "./systems/hunger";
import { motionSystem } from "./systems/motion";
import { steeringSystem } from "./systems/steering";
import { thirstSystem } from "./systems/thirst";
import { type WorldObject } from "./world-object";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const objects: WorldObject[] = [];
let nextId = 1;

objects.push(FoodResource.create(nextId++));
objects.push(WaterResource.create(nextId++));

const creatureCount = 5;
for (let i = 0; i < creatureCount; i++) {
  objects.push(Creature.create(nextId++));
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000); // clamp
  last = now;

  hungerSystem(objects, dt);
  feedingSystem(objects, dt);

  thirstSystem(objects, dt);
  drinkingSystem(objects, dt);

  steeringSystem(objects, dt);
  motionSystem(objects, dt, 1000, 1000);
  renderObjects(ctx, objects);

  requestAnimationFrame(loop);
}

loop();
