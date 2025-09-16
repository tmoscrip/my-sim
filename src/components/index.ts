export type { PositionComponent } from "./position";
export type { Render2DComponent } from "./render-2d";
export type { BehaviourMode, BehaviourComponent } from "./behaviour";
export type { PassiveResourceProvider } from "./passive-resource-provider";

import type { PositionComponent } from "./position";
import type { Render2DComponent } from "./render-2d";
import type { BehaviourComponent } from "./behaviour";
import type { NeedComponent } from "./needs";
import type { PassiveResourceProvider } from "./passive-resource-provider";
import type { PointerInputComponent } from "./pointer-input";
import type { ClickableComponent } from "./clickable";
import type { KinematicsComponent } from "./kinematic";

export type Components = {
  Position: PositionComponent;
  Render2D: Render2DComponent;
  Behaviour: BehaviourComponent;
  Needs: NeedComponent;
  PassiveResourceProvider: PassiveResourceProvider;
  PointerInput: PointerInputComponent;
  Clickable: ClickableComponent;
  Kinematics: KinematicsComponent;
};

export type ComponentKey = keyof Components;
