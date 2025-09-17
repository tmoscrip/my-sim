import type { Vec2 } from "../../math";

export type KinematicsComponent = {
  orientation: number; // radians
  velocity: Vec2;
  rotation: number; // radians per second
};
