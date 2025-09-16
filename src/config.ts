// World and rendering configuration with decoupled world units and canvas pixels

export type WorldDims = { width: number; height: number };

// World dimensions in world units (WU). Keep defaults matching prior behavior.
const world: WorldDims = { width: 1000, height: 1000 };

// Render state derived from the current canvas
let scalePxPerWU = 1; // pixels per world unit
let offsetXPx = 0; // letterbox offset in pixels
let offsetYPx = 0;
let canvasRef: HTMLCanvasElement | null = null;

function configureCanvas(canvas: HTMLCanvasElement, fitDPR = true) {
  canvasRef = canvas;
  const dpr = fitDPR ? globalThis.devicePixelRatio || 1 : 1;

  // Compute CSS size from layout (responsive)
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));

  // Match backing store to CSS size * DPR
  const bw = Math.max(1, Math.floor(cssW * dpr));
  const bh = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;

  // Compute uniform scale to fit entire world into the canvas while preserving aspect ratio
  scalePxPerWU = Math.min(
    canvas.width / world.width,
    canvas.height / world.height
  );

  // Center world in canvas (letterboxing)
  offsetXPx = Math.floor((canvas.width - world.width * scalePxPerWU) / 2);
  offsetYPx = Math.floor((canvas.height - world.height * scalePxPerWU) / 2);
}

function refit() {
  if (canvasRef) configureCanvas(canvasRef);
}

function setWorldSize(width: number, height: number) {
  world.width = Math.max(1, width);
  world.height = Math.max(1, height);
  if (canvasRef) configureCanvas(canvasRef);
}

// Coordinate transforms
function worldToScreenX(xWU: number) {
  return offsetXPx + xWU * scalePxPerWU;
}
function worldToScreenY(yWU: number) {
  return offsetYPx + yWU * scalePxPerWU;
}
function worldToScreen(xWU: number, yWU: number) {
  return { x: worldToScreenX(xWU), y: worldToScreenY(yWU) };
}
function screenToWorldX(xPx: number) {
  return (xPx - offsetXPx) / scalePxPerWU;
}
function screenToWorldY(yPx: number) {
  return (yPx - offsetYPx) / scalePxPerWU;
}
function screenToWorld(xPx: number, yPx: number) {
  return { x: screenToWorldX(xPx), y: screenToWorldY(yPx) };
}

function scalarToPixels(sWU: number) {
  return sWU * scalePxPerWU;
}

export const WorldConfig = {
  world,
  configureCanvas,
  refit,
  setWorldSize,
  get scale() {
    return scalePxPerWU;
  },
  get offsetX() {
    return offsetXPx;
  },
  get offsetY() {
    return offsetYPx;
  },
  worldToScreen,
  worldToScreenX,
  worldToScreenY,
  screenToWorld,
  screenToWorldX,
  screenToWorldY,
  scalarToPixels,
};
