import type { AssetDetails } from "./components/render-2d";
import { FoodResource, Turtle, WaterResource } from "./entities";
import { preloadAssets, renderObjects } from "./render";
import { consumeResourcesSystem } from "./systems/consume-resources";
import { motionSystem } from "./systems/motion";
import { steeringSystem } from "./systems/steering";
import { needsSystem } from "./systems/needs";
import type { World } from "./types";
import { seeksNeedsSystem } from "./systems/seek-needs";
import { query } from "./world-object";
import { PointerHighlight } from "./entities/pointer-highlight";

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

world.objects.push(PointerHighlight.create(world.nextId++));

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

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const position = pointers[0].components.Position;
  const pointer = pointers[0].components.PointerInput;
  position.x = x;
  position.y = y;
  pointer.isDown = e.buttons !== 0;
  console.log(`Pointer at ${x}, ${y} (isDown: ${pointer.isDown})`);
});

// event listener for clicks
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const position = pointers[0].components.Position;
  const pointer = pointers[0].components.PointerInput;
  position.x = x;
  position.y = y;
  pointer.isDown = e.buttons !== 0;
  console.log(`Pointer at ${x}, ${y} (isDown: ${pointer.isDown})`);
});

// event listener for clicks
canvas.addEventListener("mousedown", (e) => {
  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const pointer = pointers[0].components.PointerInput;
  pointer.isDown = true;
});

// mouse up event listener
canvas.addEventListener("mouseup", (e) => {
  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const pointer = pointers[0].components.PointerInput;
  pointer.isDown = false;
});

(async function init() {
  await preloadAssets(assetNames);
  loop();
})();
