import { GRID_COLS, GRID_ROWS, BASE_TICK_MS } from "./constants.js";

/**
 * Состояние одной игры: змейка, еда, очки, направления.
 */
export function createGameState() {
  return {
    snake: [],
    food: { x: 0, y: 0 },
    /** @type {{ dx: number, dy: number }} */
    direction: { dx: 1, dy: 0 },
    /** Буфер направления для следующего тика (стрелки/WASD) */
    pendingDir: { dx: 1, dy: 0 },
    score: 0,
    /** Кэш лучшего из localStorage (обновляется отдельно) */
    highScore: 0,
    tickMs: BASE_TICK_MS,
  };
}

/** @param {ReturnType<typeof createGameState>} s */
export function resetGameState(s) {
  const midC = (GRID_COLS / 2) | 0;
  const midR = (GRID_ROWS / 2) | 0;
  s.snake = [
    { x: midC + 1, y: midR },
    { x: midC, y: midR },
    { x: midC - 1, y: midR },
  ];
  s.direction = { dx: 1, dy: 0 };
  s.pendingDir = { dx: 1, dy: 0 };
  s.score = 0;
  s.tickMs = BASE_TICK_MS;
  s.food = { x: 0, y: 0 };
}

export { GRID_COLS, GRID_ROWS };
