import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { isBodyCollision } from "./snake.js";

export { isBodyCollision };

/**
 * @param {{x:number,y:number}} nextHead
 */
export function isOutOfBounds(nextHead) {
  return nextHead.x < 0 || nextHead.x >= GRID_COLS || nextHead.y < 0 || nextHead.y >= GRID_ROWS;
}
