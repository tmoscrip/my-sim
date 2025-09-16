export type { PositionComponent } from "./position";
export type { Render2DComponent } from "./render-2d";
export type { BehaviourComponent } from "./behaviour";
export type { PassiveResourceProvider } from "./passive-resource-provider";
export type { SteeringComponent } from "./steering";
export type { LocomotionComponent } from "./locomotion";
export type { MovementLimitsComponent } from "./movement-limits";
export type { WanderSteeringComponent } from "./wander-steering";
export type { ArriveSteeringComponent } from "./arrive-steering";
export type { BoundaryAvoidanceComponent } from "./boundary-avoidance";
export type { AlignSteeringComponent } from "./align-steering";
export type { BounceResponseComponent } from "./bounce-response";

import type { PositionComponent } from "./position";
import type { Render2DComponent } from "./render-2d";
import type { BehaviourComponent } from "./behaviour";
import type { NeedComponent } from "./needs";
import type { PassiveResourceProvider } from "./passive-resource-provider";
import type { PointerInputComponent } from "./pointer-input";
import type { ClickableComponent } from "./clickable";
import type { KinematicsComponent } from "./kinematic";
import type { SteeringComponent } from "./steering";
import type { LocomotionComponent } from "./locomotion";
import type { MovementLimitsComponent } from "./movement-limits";
import type { WanderSteeringComponent } from "./wander-steering";
import type { ArriveSteeringComponent } from "./arrive-steering";
import type { BoundaryAvoidanceComponent } from "./boundary-avoidance";
import type { AlignSteeringComponent } from "./align-steering";
import type { BounceResponseComponent } from "./bounce-response";

export type Components = {
  Position: PositionComponent;
  Render2D: Render2DComponent;
  Behaviour: BehaviourComponent;
  Needs: NeedComponent;
  PassiveResourceProvider: PassiveResourceProvider;
  PointerInput: PointerInputComponent;
  Clickable: ClickableComponent;
  Kinematics: KinematicsComponent;
  Steering: SteeringComponent;
  // New granular movement components
  MovementLimits: MovementLimitsComponent;
  WanderSteering: WanderSteeringComponent;
  ArriveSteering: ArriveSteeringComponent;
  BoundaryAvoidance: BoundaryAvoidanceComponent;
  AlignSteering: AlignSteeringComponent;
  BounceResponse: BounceResponseComponent;
  // Keep Locomotion temporarily for compatibility during migration
  Locomotion: LocomotionComponent;
};

export type ComponentKey = keyof Components;
