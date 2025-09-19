import { type Vec2 } from "../../math";
import type { EntityId } from "../../world-object";

export type SteeringOutputComponent = {
  linear: Vec2; // units per second squared
  angular: number; // radians per second squared
};

export type KinematicSteeringOutputComponent = {
  velocity: Vec2; // units per second
  rotation: number; // radians per second
};

export type FleeFromPlayerComponent = {
  isFleeing?: boolean; // state tracking, currently unused
  safeDistance: number; // units
};

export type KinematicSeekComponent = {
  target?: EntityId;
  maxSpeed?: number; // px/s
  arriveRadius?: number; // px
  timeToTarget?: number; // seconds
};
