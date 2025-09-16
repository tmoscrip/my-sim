import { vec } from "./math";
import { query, type WorldObject } from "./world-object";
import type { BehaviourComponent } from "./components/behaviour";
import type { LocomotionComponent } from "./components/locomotion";
import type { WanderSteeringComponent } from "./components/wander-steering";
import type { ArriveSteeringComponent } from "./components/arrive-steering";

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
        if ("decode" in img) await (img as any).decode();
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
  ctx.clearRect(0, 0, 1000, 1000);

  // Small helper to draw an arrow
  function drawArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number = 2,
    headSize: number = 8
  ) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hx1 = x2 + Math.cos(angle + Math.PI - 0.5) * headSize;
    const hy1 = y2 + Math.sin(angle + Math.PI - 0.5) * headSize;
    const hx2 = x2 + Math.cos(angle + Math.PI + 0.5) * headSize;
    const hy2 = y2 + Math.sin(angle + Math.PI + 0.5) * headSize;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(hx1, hy1);
    ctx.moveTo(x2, y2);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();
    ctx.restore();
  }

  const renderables = query(objs, "Position", "Render2D");
  for (const o of renderables) {
    const pos = o.components.Position!;
    const ren = o.components.Render2D!;

    o.components.Render2D!.render(ctx, o);

    if (!o.debug) continue;

    // ID label above creature
    const idFontSize = Math.max(8, Math.floor(ren.radius * 0.4));
    ctx.font = `${idFontSize}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(o.id.toString(), pos.x, pos.y - ren.radius * 0.6);

    // Needs bars below creature
    const needs = o.components.Needs;
    if (needs) {
      for (const [idx, need] of needs.entries()) {
        ctx.save();
        const barWidth = ren.radius * 2;
        const barHeight = 8;
        const barX = pos.x - barWidth / 2;
        const barY = pos.y + ren.radius + 4 + idx * (barHeight + 2);

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
        ctx.fillText(label, pos.x, barY + barHeight / 2);
        ctx.restore();
      }
    }

    // Heading arrow with speed label
    const kin = o.components.Kinematics;
    if (kin) {
      ctx.save();
      const angle = kin.orientation;
      const speed = vec.length(kin.velocity) ?? 0;

      // Arrow length scales with speed but remains readable
      const arrowLen = ren.radius + Math.min(speed, 300) * 0.5;
      const sx = pos.x;
      const sy = pos.y;
      const ex = sx + Math.cos(angle) * arrowLen;
      const ey = sy + Math.sin(angle) * arrowLen;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      const headLen = Math.max(6, Math.min(12, ren.radius * 0.4));
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

      // Kinematic vectors (velocity, acceleration)
      ctx.save();
      // Velocity vector (cyan)
      const velScale = 0.5; // pixels per (unit/s)
      const vx = pos.x + kin.velocity.x * velScale;
      const vy = pos.y + kin.velocity.y * velScale;
      drawArrow(pos.x, pos.y, vx, vy, "#00FFFF", 1.5, 6);

      // Linear acceleration from Steering contributions
      const st = o.components.Steering;
      if (st) {
        const accScale = 0.3; // pixels per (unit/s^2)

        // Draw each contribution in its color
        if (st.contributions && st.contributions.length) {
          for (const c of st.contributions) {
            const ax = pos.x + c.linear.x * accScale;
            const ay = pos.y + c.linear.y * accScale;
            drawArrow(pos.x, pos.y, ax, ay, c.debugColor ?? "#CCCCCC", 1.2, 5);
          }
        }

        // Draw resultant in orange as before
        const ax = pos.x + st.linear.x * accScale;
        const ay = pos.y + st.linear.y * accScale;
        drawArrow(pos.x, pos.y, ax, ay, "#FFA500", 1.8, 7);

        // Optional: small arc indicating angular velocity direction/magnitude
        const r = ren.radius + 10;
        const arcMag = Math.min(0.8, Math.abs(kin.rotation) * 0.2);
        ctx.beginPath();
        ctx.strokeStyle = "#FFD580";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.arc(
          pos.x,
          pos.y,
          r,
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
      // place under id label
      ctx.font = `${Math.max(
        8,
        Math.floor(ren.radius * 0.2)
      )}px -apple-system, system-ui, sans-serif`;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.strokeText(label, pos.x, pos.y + ren.radius / 2);
      ctx.fillStyle = "white";
      ctx.fillText(label, pos.x, pos.y + ren.radius / 2);
      ctx.restore();

      // Behavior-specific overlays use Locomotion
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

        ctx.save();
        // Line to circle center
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(circleCenter.x, circleCenter.y);
        ctx.strokeStyle = "#00B7FF";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.stroke();

        // Wander circle
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.arc(circleCenter.x, circleCenter.y, wanderRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#00B7FF";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Line to current wander target
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(circleCenter.x, circleCenter.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "#FF4DFF";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target marker
        ctx.beginPath();
        ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
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
          ctx.save();
          // Line from seeker to target
          drawArrow(pos.x, pos.y, tpos.x, tpos.y, "#66FF66", 1.2, 7);

          // Slow radius (dashed orange)
          ctx.beginPath();
          ctx.setLineDash([6, 4]);
          ctx.arc(tpos.x, tpos.y, slowRadius, 0, Math.PI * 2);
          ctx.strokeStyle = "#FFA500";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Target radius (solid green)
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.arc(tpos.x, tpos.y, targetRadius, 0, Math.PI * 2);
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Target marker
          ctx.beginPath();
          ctx.arc(tpos.x, tpos.y, 3, 0, Math.PI * 2);
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
      ctx.arc(pos.x, pos.y, ren.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.restore();
    }
  }
}
