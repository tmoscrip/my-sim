export type { PositionComponent } from "./position";
export type { MotionComponent } from "./motion";
export type { Render2DComponent } from "./render-2d";
export type { BehaviourMode, BehaviourComponent } from "./behaviour";
export type { PassiveResourceProvider } from "./passive-resource-provider";

import type { PositionComponent } from "./position";
import type { MotionComponent } from "./motion";
import type { Render2DComponent } from "./render-2d";
import type { BehaviourComponent } from "./behaviour";
import type { NeedComponent } from "./needs";
import type { PassiveResourceProvider } from "./passive-resource-provider";
import type { PointerInputComponent } from "./pointer-input";
import type { ClickableComponent } from "./clickable";

export type Components = {
  Position: PositionComponent;
  Motion: MotionComponent;
  Render2D: Render2DComponent;
  Behaviour: BehaviourComponent;
  Needs: NeedComponent;
  PassiveResourceProvider: PassiveResourceProvider;
  PointerInput: PointerInputComponent;
  Clickable: ClickableComponent;
};

export type ComponentKey = keyof Components;
