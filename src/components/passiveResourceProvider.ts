export type Resources = "Food" | "Water";

export type PassiveResourceProvider = {
  provides: Resources[];
  radius: number; // radius within which to provide resources
  providedPerSecond: number; // amount of resources provided per second
};
