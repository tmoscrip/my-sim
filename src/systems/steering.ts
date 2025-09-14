import type { WorldObject } from "../world-object";
import { query } from "../world-object";

const TAU = Math.PI * 2;

function wrapAngle(a: number): number {
  a = a % TAU;
  return a < 0 ? a + TAU : a;
}

function shortestAngleDiff(target: number, current: number): number {
  let d = (target - current) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function steeringSystem(objs: WorldObject[], dt: number) {
  const movers = query(objs, "Position", "Motion", "Behaviour");
  for (const o of movers) {
    const pos = o.components.Position;
    const mot = o.components.Motion;
    const beh = o.components.Behaviour;

    const desiredSpeed = beh.desiredSpeed;
    const turnRate = beh.turnRate;

    // Mode-independent speed control (except Idle). These are set per-mode then applied once.
    let speedFactor = 1; // 1 = full desiredSpeed
    let idle = false;

    switch (beh.mode) {
      case "Idle": {
        idle = true;
        // leave heading unchanged
        break;
      }

      case "Wander": {
        // Heading jitter only (speed handled after switch)
        const interval = beh.wanderTurnInterval;
        const jitter = beh.wanderJitter; // radians
        const reverseChance = beh.reverseChance;

        if (
          typeof interval === "number" &&
          interval > 0 &&
          typeof jitter === "number" &&
          jitter > 0
        ) {
          if (Math.random() < dt / interval) {
            mot.heading = wrapAngle(mot.heading + randRange(-jitter, jitter));
          }
        }

        if (typeof reverseChance === "number" && reverseChance > 0) {
          if (Math.random() < reverseChance * dt) {
            mot.heading = wrapAngle(mot.heading + Math.PI);
          }
        }

        break;
      }

      case "Seek": {
        if (!beh.target) {
          idle = true;
          break;
        }

        const dx = beh.target.x - pos.x;
        const dy = beh.target.y - pos.y;
        const dist = Math.hypot(dx, dy);

        const arriveDist = beh.arriveDistance ?? 8;
        const slowRadius = Math.max(arriveDist, beh.slowRadius ?? 120);

        // Desired bearing
        const bearing = Math.atan2(dy, dx);

        // Turn towards target with limited turn rate
        const delta = shortestAngleDiff(bearing, mot.heading);
        const maxTurn = turnRate * dt;
        const step = clamp(delta, -maxTurn, maxTurn);
        mot.heading = wrapAngle(mot.heading + step);

        // Set speed factor based on distance; arrive -> idle
        if (dist <= arriveDist) {
          idle = true;
          beh.mode = "Idle";
        } else {
          speedFactor = clamp(dist / slowRadius, 0, 1);
        }

        break;
      }
    }

    // Apply shared speed logic (independent of mode, except Idle)
    if (!idle) {
      const cruise = desiredSpeed * speedFactor;
      if (cruise > 0) {
        const prev = Math.max(0, mot.speed ?? cruise);
        let f = prev / cruise; // current speed factor
        const theta = 1.5; // mean reversion rate (1/s)
        const sigma = 0.12; // noise strength
        const noise = randRange(-1, 1);
        f += theta * (1 - f) * dt + sigma * Math.sqrt(dt) * noise;
        f = clamp(f, 0.85, 1.15);
        mot.speed = cruise * f;
      } else {
        mot.speed = 0;
      }
    } else {
      mot.speed = 0;
    }
  }
}
