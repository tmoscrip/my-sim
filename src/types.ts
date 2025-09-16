import type { WorldObject } from "./world-object";

export type System = (objs: WorldObject[], dt: number) => void;

export type World = {
  objects: WorldObject[];
  nextId: number;
  systems: System[];
};
