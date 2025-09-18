import { getMoveVector } from "../components/input/player-control";
import { query, type WorldObject } from "../world-object";
import { getLimits } from "./kinematics";

export function playerControlSystem(objs: WorldObject[], dt: number) {
  const players = query(objs, "Position", "Kinematics", "PlayerControl");
  for (const player of players) {
    const { Kinematics, PlayerControl } = player.components;
    const moveVec = getMoveVector();

    if (PlayerControl) {
      PlayerControl.moveUp = moveVec.y < 0;
      PlayerControl.moveDown = moveVec.y > 0;
      PlayerControl.moveLeft = moveVec.x < 0;
      PlayerControl.moveRight = moveVec.x > 0;
    }

    const limits = getLimits(player);
    const accelMag = limits.maxAcceleration ?? 800;

    if (moveVec.x !== 0 || moveVec.y !== 0) {
      Kinematics.velocity.x += moveVec.x * accelMag * dt;
      Kinematics.velocity.y += moveVec.y * accelMag * dt;
    }
  }
}
