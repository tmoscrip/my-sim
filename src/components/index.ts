export type { PositionComponent } from "./position";
export type { CanvasRendererComponent } from "./draw/canvas-renderer";
export type { EmojiRendererComponent } from "./draw/emoji-renderer";
export type { SpriteRendererComponent } from "./draw/sprite-renderer";
export type { BehaviourComponent } from "./behaviour/behaviour";
export type { PassiveResourceProvider } from "./behaviour/passive-resource-provider";
export type { MovementLimitsComponent } from "./physics/movement-limits";
export type { WanderSteeringComponent } from "./physics/wander-steering";
export type { ArriveSteeringComponent } from "./physics/arrive-steering";
export type { BoundaryAvoidanceComponent } from "./physics/boundary-avoidance";
export type { AlignSteeringComponent } from "./physics/align-steering";

import type { PositionComponent } from "./position";
import type { CanvasRendererComponent } from "./draw/canvas-renderer";
import type { EmojiRendererComponent } from "./draw/emoji-renderer";
import type { SpriteRendererComponent } from "./draw/sprite-renderer";
import type { BehaviourComponent } from "./behaviour/behaviour";
import type { NeedComponent } from "./behaviour/needs";
import type { PassiveResourceProvider } from "./behaviour/passive-resource-provider";
import type { PointerInputComponent } from "./input/pointer-input";
import type { ClickableComponent } from "./clickable";
import type { KinematicsComponent } from "./physics/kinematic";
import type { MovementLimitsComponent } from "./physics/movement-limits";
import type { WanderSteeringComponent } from "./physics/wander-steering";
import type { ArriveSteeringComponent } from "./physics/arrive-steering";
import type { BoundaryAvoidanceComponent } from "./physics/boundary-avoidance";
import type { AlignSteeringComponent } from "./physics/align-steering";

export type Components = {
  Position: PositionComponent;
  CanvasRenderer: CanvasRendererComponent;
  EmojiRenderer: EmojiRendererComponent;
  SpriteRenderer: SpriteRendererComponent;
  Behaviour: BehaviourComponent;
  Needs: NeedComponent;
  PassiveResourceProvider: PassiveResourceProvider;
  PointerInput: PointerInputComponent;
  Clickable: ClickableComponent;
  Kinematics: KinematicsComponent;
  MovementLimits: MovementLimitsComponent;
  WanderSteering: WanderSteeringComponent;
  ArriveSteering: ArriveSteeringComponent;
  BoundaryAvoidance: BoundaryAvoidanceComponent;
  AlignSteering: AlignSteeringComponent;
};

export type ComponentKey = keyof Components;
