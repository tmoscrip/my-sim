import { getMoveVector } from "../components/input/player-control";
import { query, type WorldObject } from "../world-object";
import { getLimits } from "./kinematics";

export function steerPlayerSystem(objs: WorldObject[], dt: number) {
  const players = query(objs, "Position", "SteeringOutput", "PlayerControl");
  for (const player of players) {
    const { SteeringOutput, PlayerControl } = player.components;
    const moveVec = getMoveVector();

    if (PlayerControl) {
      PlayerControl.moveUp = moveVec.y < 0;
      PlayerControl.moveDown = moveVec.y > 0;
      PlayerControl.moveLeft = moveVec.x < 0;
      PlayerControl.moveRight = moveVec.x > 0;
    }

    const limits = getLimits(player);
    const accelMag = limits.maxAcceleration ?? 800;

    SteeringOutput.linear.x = moveVec.x * accelMag;
    SteeringOutput.linear.y = moveVec.y * accelMag;
  }
}
