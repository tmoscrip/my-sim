import { query, type WorldObject } from "./world-object";
import { renderMultiple } from "./components/draw";
import { WorldConfig } from "./config";
import { vec } from "./math";

const CACHE = new Map<string, HTMLImageElement>();
const BASE = "assets/";

function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Ensure decode completes for SVGs
        if ("decode" in img && typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        // Ignore decode errors; onload already fired
      }
      resolve(img);
    };
    img.onerror = (e) => reject(e);
  });
}

export async function preloadAssets(
  names: string[],
  base = BASE
): Promise<void> {
  const unique = Array.from(new Set(names));
  await Promise.all(
    unique.map(async (name) => {
      if (CACHE.has(name)) return;
      const img = await loadImage(base + name);
      CACHE.set(name, img);
    })
  );
}

export function getAssetSync(name: string): HTMLImageElement | undefined {
  return CACHE.get(name);
}

export function renderObjects(
  ctx: CanvasRenderingContext2D,
  objs: WorldObject[]
) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderables = query(objs, "Position");
  for (const o of renderables) {
    renderMultiple(ctx, o);

    if (o.components.SteeringOutput) {
      const pos = o.components.Position!;
      const sp = WorldConfig.worldToScreen(pos.x, pos.y);
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.beginPath();
      const v = vec.make(0, 0);
      vec.add(v, o.components.SteeringOutput.linear, v);
      vec.normalize(v, v);
      if (vec.length(v) > 0) {
        const angle = Math.atan2(v.y, v.x);
        ctx.rotate(angle);
      }

      ctx.beginPath();
      const arrowLength = vec.length(v) * 40;
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowLength, 0);
      ctx.lineTo(arrowLength - 5, -5);
      ctx.lineTo(arrowLength - 5, 5);
      ctx.fillStyle = "rgba(0,255,0,0.8)";
      ctx.fill();

      ctx.restore();
    }
  }
}
