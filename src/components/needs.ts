import type { Resources } from "./passiveResourceProvider";

export type NeedComponent = {
  name: Resources;
  value: number;
  min: number;
  max: number;
  lossPerSecond: number;
  seekAtFraction: number;
  satiatedAtFraction: number;
}[];
