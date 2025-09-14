import { Creature, FoodResource, WaterResource } from "./entities";
import { renderObjects } from "./render";
import { drinkingSystem } from "./systems/drinking";
import { feedingSystem } from "./systems/feeding";
import { hungerSystem } from "./systems/hunger";
import { motionSystem } from "./systems/motion";
import { steeringSystem } from "./systems/steering";
import { thirstSystem } from "./systems/thirst";
import type { World } from "./types";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const world: World = {
  objects: [],
  nextId: 1,
  systems: [
    hungerSystem,
    feedingSystem,
    thirstSystem,
    drinkingSystem,
    steeringSystem,
    motionSystem,
  ],
};

world.objects.push(FoodResource.create(world.nextId++));
world.objects.push(WaterResource.create(world.nextId++));

const creatureCount = 10;
for (let i = 0; i < creatureCount; i++) {
  world.objects.push(Creature.create(world.nextId++));
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000); // clamp
  last = now;

  world.systems.forEach((system) => system(world.objects, dt));

  renderObjects(ctx, world.objects);
  requestAnimationFrame(loop);
}

loop();
