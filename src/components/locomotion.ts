/**
 * LocomotionComponent
 *
 * DEPRECATION: This monolithic component is being migrated to granular
 * MovementLimits + per-behavior steering components (WanderSteering,
 * ArriveSteering, BoundaryAvoidance, AlignSteering). It remains for
 * backward compatibility during the transition.
 *
 * Canonical, per-entity movement/steering parameters used by all behaviors
 * (Seek/Arrive, Wander, Align). These parameters persist across behavior mode
 * switches; only Behaviour.mode/state changes at runtime.
 *
 * Conventions
 * - Positions are in pixels.
 * - Linear speeds are in pixels/second; accelerations in pixels/second^2.
 * - Angles are radians; angular speeds in radians/second; angular accelerations in radians/second^2.
 * - Time constants are in seconds.
 *
 * References
 * - AI for Games (3rd ed.), ch. 3.2: Seek/Arrive, Wander, Align.
 */
export type LocomotionComponent = {
  /**
   * Maximum linear speed (px/s).
   * Caps the magnitude of the integrated velocity during kinematic updates.
   */
  maxSpeed: number;

  /**
   * Maximum linear acceleration (px/s^2).
   * Caps the magnitude of the linear steering produced by behaviors.
   */
  maxAcceleration: number;

  // --- Wander (Reynolds/AI for Games) ---

  /**
   * Wander circle radius (px).
   * The target point is chosen on this circle to influence direction changes.
   * Typical: 10–120 depending on scale; larger -> broader arcs.
   */
  wanderRadius: number;

  /**
   * Forward distance from the entity to the center of the wander circle (px).
   * Controls how far ahead the sampling circle is placed. Larger -> smoother path.
   */
  wanderDistance: number;

  /**
   * Max wander angle jitter rate (rad/s).
   * The wanderAngle is perturbed by a binomial noise limited by jitter*dt.
   * Larger values lead to more erratic heading changes.
   */
  wanderJitter: number;

  /**
   * Time constant used when steering toward the wander desired velocity (s).
   * Lower -> snappier acceleration toward the wander direction.
   */
  wanderTimeToTarget: number;

  /**
   * Optional mean-reversion rate for wanderAngle (1/s).
   * Pulls wanderAngle back toward 0 over time to prevent persistent circling.
   * If omitted, a sensible default is applied in the system.
   */
  wanderDecayPerSec?: number;

  /**
   * Optional clamp for wanderAngle around the forward direction (rad).
   * Limits the heading cone (e.g., ~1.2 rad) to reduce tight looping.
   */
  wanderMaxArc?: number;

  /**
   * Optional cruising speed to use during Wander (px/s).
   * Decouples wander speed from wanderDistance. If undefined, systems will
   * default to a fraction of maxSpeed (e.g., 0.6 * maxSpeed).
   */
  wanderCruiseSpeed?: number;

  // --- Align (angular) ---

  /** Maximum angular speed (rad/s). */
  maxRotation: number;

  /** Maximum angular acceleration (rad/s^2). */
  maxAngularAcceleration: number;

  /**
   * Align target radius (rad).
   * If the angular difference is below this, we consider alignment complete
   * and produce acceleration to stop rotating.
   */
  angularTargetRadius: number;

  /**
   * Align slow radius (rad).
   * Within this radius, target rotation scales down proportionally.
   */
  angularSlowRadius: number;

  /**
   * Time constant for reaching target rotation (s).
   * Used to compute angular acceleration toward the target rotation.
   */
  angularTimeToTarget: number;

  // --- Seek/Arrive ---

  /**
   * Arrive target radius (px).
   * Inside this radius, desired speed becomes 0.
   */
  targetRadius: number;

  /**
   * Arrive slow radius (px).
   * Inside this radius, desired speed scales with distance.
   */
  slowRadius: number;

  /**
   * Time constant for reaching desired linear velocity (s).
   * Used by Seek/Arrive to compute linear acceleration toward target velocity.
   */
  timeToTarget: number;

  // --- Boundary Avoidance (optional) ---

  /**
   * Forward look-ahead distance used to probe for impending boundary collisions (px).
   * If omitted, a speed-scaled default will be used by the system.
   */
  boundaryLookAhead?: number;

  /**
   * Soft buffer distance from the world bounds within which avoidance activates (px).
   * Think of this as the desired clearance from walls.
   */
  boundaryBuffer?: number;

  /**
   * Base linear avoidance strength (px/s^2).
   * Scales the acceleration applied away from nearby walls.
   */
  boundaryStrength?: number;

  /**
   * Multiplier for angular avoidance response (unitless).
   * Scales the Align-based angular acceleration used to turn away from walls.
   */
  boundaryAngularScale?: number;
};
