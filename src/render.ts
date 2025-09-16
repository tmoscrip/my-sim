import { vec } from "./math";
import { query, type WorldObject } from "./world-object";
import type { BehaviourComponent, LocomotionComponent } from "./components";
import type { WanderSteeringComponent } from "./components";
import type { ArriveSteeringComponent } from "./components";
import { WorldConfig } from "./config";

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
  // Clear using full canvas backing size
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Small helper to draw an arrow in world units (auto scales to pixels)
  function drawArrow(
    x1WU: number,
    y1WU: number,
    x2WU: number,
    y2WU: number,
    color: string,
    widthPx: number = 2,
    headSizePx: number = 8
  ) {
    const s1 = WorldConfig.worldToScreen(x1WU, y1WU);
    const s2 = WorldConfig.worldToScreen(x2WU, y2WU);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = widthPx;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();

    // Head
    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
    const hx1 = s2.x + Math.cos(angle + Math.PI - 0.5) * headSizePx;
    const hy1 = s2.y + Math.sin(angle + Math.PI - 0.5) * headSizePx;
    const hx2 = s2.x + Math.cos(angle + Math.PI + 0.5) * headSizePx;
    const hy2 = s2.y + Math.sin(angle + Math.PI + 0.5) * headSizePx;
    ctx.beginPath();
    ctx.moveTo(s2.x, s2.y);
    ctx.lineTo(hx1, hy1);
    ctx.moveTo(s2.x, s2.y);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();
    ctx.restore();
  }

  const renderables = query(objs, "Position", "Render2D");
  for (const o of renderables) {
    const pos = o.components.Position!;
    const ren = o.components.Render2D!;

    // Render function should draw in world space using transforms
    o.components.Render2D!.render(ctx, o);

    if (!o.debug) continue;

    // ID label above creature
    const radiusPx = WorldConfig.scalarToPixels(ren.radius);
    const idFontSize = Math.max(8, Math.floor(radiusPx * 0.4));
    const sp = WorldConfig.worldToScreen(pos.x, pos.y);
    ctx.font = `${idFontSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(o.id.toString(), sp.x, sp.y - radiusPx * 0.6);

    // Needs bars below creature (sizes in pixels for UI clarity)
    const needs = o.components.Needs;
    if (needs) {
      for (const [idx, need] of needs.entries()) {
        ctx.save();
        const barWidth = radiusPx * 2;
        const barHeight = 8;
        const barX = sp.x - barWidth / 2;
        const barY = sp.y + radiusPx + 4 + idx * (barHeight + 2);

        // Background
        ctx.fillStyle = "black";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Foreground
        const hungerPercent = need.value / 100;
        ctx.fillStyle =
          need.name == "Food"
            ? "green"
            : need.name == "Water"
            ? "blue"
            : "yellow";
        ctx.fillRect(barX, barY, barWidth * hungerPercent, barHeight);

        // Percent label
        const label = Math.round(need.value).toString();
        ctx.font = `10px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.fillText(label, sp.x, barY + barHeight / 2);
        ctx.restore();
      }
    }

    // Heading arrow with speed label (positions in world, strokes in px)
    const kin = o.components.Kinematics;
    if (kin) {
      ctx.save();
      const angle = kin.orientation;
      const speed = vec.length(kin.velocity) ?? 0; // world units per second

      // Arrow length in pixels scales with speed but remains readable
      const arrowLenPx = radiusPx + Math.min(speed, 300) * 0.5;
      const sx = sp.x;
      const sy = sp.y;
      const ex = sx + Math.cos(angle) * arrowLenPx;
      const ey = sy + Math.sin(angle) * arrowLenPx;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      const headLen = Math.max(6, Math.min(12, radiusPx * 0.4));
      const left = angle + Math.PI - 0.5;
      const right = angle + Math.PI + 0.5;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(left) * headLen, ey + Math.sin(left) * headLen);
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex + Math.cos(right) * headLen,
        ey + Math.sin(right) * headLen
      );
      ctx.stroke();

      // Speed label near arrow tip
      const label = Number.isFinite(speed) ? speed.toFixed(0) : "0";
      ctx.font = `12px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.strokeText(label, ex + 6, ey);
      ctx.fillStyle = "white";
      ctx.fillText(label, ex + 6, ey);

      ctx.restore();

      // Kinematic vectors (velocity, acceleration) in world mapped to px
      ctx.save();
      const velScalePx = 0.5; // pixels per (WU/s)
      const vx = sp.x + kin.velocity.x * velScalePx;
      const vy = sp.y + kin.velocity.y * velScalePx;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(vx, vy);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Linear acceleration from Steering contributions
      const st = o.components.Steering;
      if (st) {
        const accScalePx = 0.3; // pixels per (WU/s^2)

        // Draw each contribution in its color
        if (st.contributions && st.contributions.length) {
          for (const c of st.contributions) {
            drawArrow(
              pos.x,
              pos.y,
              pos.x + c.linear.x * (accScalePx / WorldConfig.scale),
              pos.y + c.linear.y * (accScalePx / WorldConfig.scale),
              c.debugColor ?? "#CCCCCC",
              1.2,
              5
            );
          }
        }

        // Draw resultant in orange as before
        const ax = sp.x + st.linear.x * accScalePx;
        const ay = sp.y + st.linear.y * accScalePx;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = "#FFA500";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Optional: small arc indicating angular velocity direction/magnitude
        const rPx = radiusPx + 10;
        const arcMag = Math.min(0.8, Math.abs(kin.rotation) * 0.2);
        ctx.beginPath();
        ctx.strokeStyle = "#FFD580";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.arc(
          sp.x,
          sp.y,
          rPx,
          kin.orientation - arcMag,
          kin.orientation + arcMag
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Behaviour mode label on creature
    const beh = o.components.Behaviour as BehaviourComponent | undefined;
    if (beh && beh.mode) {
      ctx.save();
      const label = beh.mode;
      ctx.font = `${Math.max(
        8,
        Math.floor(radiusPx * 0.2)
      )}px -apple-system, system-ui, sans-serif`;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.strokeText(label, sp.x, sp.y + radiusPx / 2);
      ctx.fillStyle = "white";
      ctx.fillText(label, sp.x, sp.y + radiusPx / 2);
      ctx.restore();

      // Behavior-specific overlays use Locomotion (drawn in world units)
      const loco = o.components.Locomotion as LocomotionComponent | undefined;
      const wanderComp = o.components.WanderSteering as
        | WanderSteeringComponent
        | undefined;
      if (
        beh.mode === "Wander" &&
        (wanderComp || loco) &&
        o.components.Kinematics
      ) {
        const kinW = o.components.Kinematics;
        const forward = {
          x: Math.cos(kinW.orientation),
          y: Math.sin(kinW.orientation),
        };
        const wanderDistance =
          wanderComp?.distance ?? loco?.wanderDistance ?? 0;
        const wanderRadius = wanderComp?.radius ?? loco?.wanderRadius ?? 0;
        const circleCenter = vec.add(
          vec.clone(pos),
          vec.scale(forward, wanderDistance, vec.make(0, 0)),
          vec.make(0, 0)
        );
        const angle = kinW.orientation + (beh.wanderAngle ?? 0);
        const target = {
          x: circleCenter.x + Math.cos(angle) * wanderRadius,
          y: circleCenter.y + Math.sin(angle) * wanderRadius,
        };

        // Lines and circles in world mapped to screen
        const ccS = WorldConfig.worldToScreen(circleCenter.x, circleCenter.y);
        const pS = WorldConfig.worldToScreen(pos.x, pos.y);
        const tS = WorldConfig.worldToScreen(target.x, target.y);
        const rPx = WorldConfig.scalarToPixels(wanderRadius);

        ctx.save();
        // Line to circle center
        ctx.beginPath();
        ctx.moveTo(pS.x, pS.y);
        ctx.lineTo(ccS.x, ccS.y);
        ctx.strokeStyle = "#00B7FF";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.stroke();

        // Wander circle
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.arc(ccS.x, ccS.y, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = "#00B7FF";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Line to current wander target
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(ccS.x, ccS.y);
        ctx.lineTo(tS.x, tS.y);
        ctx.strokeStyle = "#FF4DFF";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target marker
        ctx.beginPath();
        ctx.arc(tS.x, tS.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FF4DFF";
        ctx.fill();

        ctx.restore();
      } else if (beh.mode === "Seek" && (o.components.ArriveSteering || loco)) {
        // Render target and arrival radii
        const targetId = (beh as Extract<BehaviourComponent, { mode: "Seek" }>)
          .targetId;
        const targetObj = objs.find((e) => e.id === targetId);
        const tpos = targetObj?.components.Position;
        const arriveComp = o.components.ArriveSteering as
          | ArriveSteeringComponent
          | undefined;
        const slowRadius = arriveComp?.slowRadius ?? loco?.slowRadius ?? 0;
        const targetRadius =
          arriveComp?.targetRadius ?? loco?.targetRadius ?? 0;
        if (tpos) {
          const sS = WorldConfig.worldToScreen(pos.x, pos.y);
          const tS = WorldConfig.worldToScreen(tpos.x, tpos.y);
          const slowPx = WorldConfig.scalarToPixels(slowRadius);
          const targetPx = WorldConfig.scalarToPixels(targetRadius);
          ctx.save();
          // Line from seeker to target
          ctx.beginPath();
          ctx.moveTo(sS.x, sS.y);
          ctx.lineTo(tS.x, tS.y);
          ctx.strokeStyle = "#66FF66";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Slow radius (dashed orange)
          ctx.beginPath();
          ctx.setLineDash([6, 4]);
          ctx.arc(tS.x, tS.y, slowPx, 0, Math.PI * 2);
          ctx.strokeStyle = "#FFA500";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Target radius (solid green)
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.arc(tS.x, tS.y, targetPx, 0, Math.PI * 2);
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Target marker
          ctx.beginPath();
          ctx.arc(tS.x, tS.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00FF00";
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // Radius representing click box
    if (o.components.Clickable) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radiusPx + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.restore();
    }
  }
}
