import type { AssetDetails } from "./components/render-2d";
import { FoodResource, Turtle, WaterResource } from "./entities";
import { preloadAssets, renderObjects } from "./render";
import { consumeResourcesSystem } from "./systems/consume-resources";
import { motionSystem } from "./systems/motion";
import { steeringSystem } from "./systems/steering";
import { needsSystem } from "./systems/needs";
import type { World } from "./types";
import { seeksNeedsSystem } from "./systems/seek-needs";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

const world: World = {
  objects: [],
  nextId: 1,
  systems: [
    seeksNeedsSystem,
    needsSystem,
    consumeResourcesSystem,
    steeringSystem,
    motionSystem,
  ],
};

world.objects.push(FoodResource.create(world.nextId++));
world.objects.push(FoodResource.create(world.nextId++));
world.objects.push(FoodResource.create(world.nextId++));
world.objects.push(WaterResource.create(world.nextId++));
world.objects.push(WaterResource.create(world.nextId++));
world.objects.push(WaterResource.create(world.nextId++));

const creatureCount = 20;
for (let i = 0; i < creatureCount; i++) {
  world.objects.push(Turtle.create(world.nextId++));
}

// TODO: This breaks if an asset is added later
const assetNames = Array.from(
  new Set(
    world.objects
      .map((o) => o.components.Render2D?.asset)
      .filter((a): a is AssetDetails => !!a)
      .map((a) => a.path)
  )
);

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000); // clamp
  last = now;

  world.systems.forEach((system) => system(world.objects, dt));

  renderObjects(ctx, world.objects);
  requestAnimationFrame(loop);

  logFps(now, dt, 5000);
}

function logFps(now: number, dt: number, intervalMillis = 1000) {
  if (
    Math.floor(now / intervalMillis) !==
    Math.floor((now - dt * 1000) / intervalMillis)
  ) {
    const fps = Math.round(1 / dt);
    console.log(`FPS: ${fps}`);
  }
}

(async function init() {
  await preloadAssets(assetNames);
  loop();
})();
