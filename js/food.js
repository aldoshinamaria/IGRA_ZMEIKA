import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { occupied } from "./snake.js";

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 */
function randomEmptyCell(state) {
  const { snake } = state;
  const free = [];
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      if (!occupied(snake, x, y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[(Math.random() * free.length) | 0];
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 */
export function placeFood(state) {
  const cell = randomEmptyCell(state);
  if (cell) state.food = cell;
}
