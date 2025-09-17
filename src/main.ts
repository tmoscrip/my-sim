import { FoodResource, Turtle, WaterResource } from "./entities";
import { preloadAssets, renderObjects } from "./render";
import { consumeResourcesSystem } from "./systems/consume-resources";
import { behaviourSystem } from "./systems/steering";
import { needsSystem } from "./systems/needs";
import type { World } from "./types";
import { seeksNeedsSystem } from "./systems/seek-needs";
import { query } from "./world-object";
import { PointerHighlight } from "./entities/pointer";
import { updateKinematicsSystem } from "./systems/kinematics";
import { WorldConfig } from "./config";
import { Player } from "./entities/player";
import type { AssetDetails } from "./components/draw/sprite-renderer";

const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
WorldConfig.configureCanvas(canvas);

export const world: World = {
  objects: [],
  nextId: 1,
  systems: [
    needsSystem,
    seeksNeedsSystem,
    consumeResourcesSystem,
    behaviourSystem, // Process behaviors to produce steering forces
    updateKinematicsSystem, // Integrate kinematics with accumulated steering
  ],
};

world.objects = [
  PointerHighlight.create(world.nextId++), // Add pointer first so it's at the back
  Player.create(world.nextId++),
  ...Array.from({ length: 3 }, () => FoodResource.create(world.nextId++)),
  ...Array.from({ length: 3 }, () => WaterResource.create(world.nextId++)),
  ...Array.from({ length: 8 }, () => Turtle.create(world.nextId++)),
];

// TODO: This breaks if an asset is added later
const assetNames = Array.from(
  new Set(
    world.objects
      .map((o) => o.components.SpriteRenderer?.asset)
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
  // Convert CSS pixels to canvas backing pixels (handles DPR)
  const dpr =
    rect.width > 0
      ? canvas.width / rect.width
      : globalThis.devicePixelRatio || 1;
  const xPx = (e.clientX - rect.left) * dpr;
  const yPx = (e.clientY - rect.top) * dpr;
  const { x, y } = WorldConfig.screenToWorld(xPx, yPx);

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
});

canvas.addEventListener("mousedown", () => {
  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const pointer = pointers[0].components.PointerInput;
  const pos = pointers[0].components.Position;
  pointer.isDown = true;
  // Pass world-space coords to click handler
  pointer.onClick(pos.x, pos.y);
});

canvas.addEventListener("mouseup", () => {
  var pointers = query(world.objects, "PointerInput", "Position");
  if (pointers.length === 0) return;
  if (pointers.length > 1) {
    console.warn("Multiple PointerInput components found, using the first one");
  }
  const pointer = pointers[0].components.PointerInput;
  pointer.isDown = false;
});

window.addEventListener("resize", () => WorldConfig.refit());
matchMedia(
  `(resolution: ${globalThis.devicePixelRatio || 1}dppx)`
).addEventListener?.("change", () => WorldConfig.refit());

// Entry point
(async function init() {
  await preloadAssets(assetNames);
  loop();
})();
