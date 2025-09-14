import type { WorldObject } from "../world-object";
import { hasAll } from "../world-object";

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
  for (const o of objs) {
    if (!hasAll(o, "Position", "Motion", "Behaviour")) continue;

    const pos = o.components.Position;
    const mot = o.components.Motion;
    const beh = o.components.Behaviour;

    const desiredSpeed = beh.desiredSpeed ?? 0;
    const turnRate = beh.turnRate ?? 2.0; // rad/s

    switch (beh.mode) {
      case "Idle": {
        mot.speed = 0;
        // optionally bleed rotational jitter to zero; we leave heading as-is.
        break;
      }

      case "Wander": {
        // Cruise around desired speed with slight fluctuation (±15%)
        const cruise = desiredSpeed;
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

        const interval = beh.wanderTurnInterval;
        const jitter = beh.wanderJitter; // radians
        const reverseChance = beh.reverseChance;

        // Apply small heading nudge only if both interval and jitter are provided and valid
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

        // Apply occasional 180° turn only if reverseChance is provided and > 0
        if (typeof reverseChance === "number" && reverseChance > 0) {
          if (Math.random() < reverseChance * dt) {
            mot.heading = wrapAngle(mot.heading + Math.PI);
          }
        }

        break;
      }

      case "Seek": {
        if (!beh.target) {
          // No target: default to Idle
          mot.speed = 0;
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

        // Speed: slow down when close, stop when arrived
        if (dist <= arriveDist) {
          mot.speed = 0;
          // Optionally switch to Idle to stop steering
          beh.mode = "Idle";
        } else {
          const slowFactor = clamp(dist / slowRadius, 0, 1);
          mot.speed = desiredSpeed * slowFactor;
        }

        break;
      }
    }
  }
}
