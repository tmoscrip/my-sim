export type { Vec2 } from "./types";
export type { PositionComponent } from "./position";
export type { MotionComponent } from "./motion";
export type { Render2DComponent } from "./render2d";
export type { BehaviourMode, BehaviourComponent } from "./behaviour";
export type { HungerComponent } from "./hunger";
export type { FoodProviderComponent } from "./foodProvider";
export type { ThirstComponent } from "./thirst";
export type { WaterProviderComponent } from "./waterProvider";

import type { PositionComponent } from "./position";
import type { MotionComponent } from "./motion";
import type { Render2DComponent } from "./render2d";
import type { BehaviourComponent } from "./behaviour";
import type { HungerComponent } from "./hunger";
import type { FoodProviderComponent } from "./foodProvider";
import type { ThirstComponent } from "./thirst";
import type { WaterProviderComponent } from "./waterProvider";

export type Components = {
  Position: PositionComponent;
  Motion: MotionComponent;
  Render2D: Render2DComponent;
  Behaviour: BehaviourComponent;
  Hunger: HungerComponent;
  FoodProvider: FoodProviderComponent;
  Thirst: ThirstComponent;
  WaterProvider: WaterProviderComponent;
};

export type ComponentKey = keyof Components;
