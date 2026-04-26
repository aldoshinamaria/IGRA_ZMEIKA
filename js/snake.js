/** @param {Array<{x:number,y:number}>} body @param {number} x @param {number} y */
export function occupied(body, x, y) {
  return body.some((p) => p.x === x && p.y === y);
}

/**
 * Направление для тика: нельзя развернуться на 180° за один шаг; буфер «ввод» в pendingDir сохраняем.
 * @param {ReturnType<import("./state.js").createGameState>} state
 */
export function getNextDirection(state) {
  const p = state.pendingDir;
  if (p.dx === -state.direction.dx && p.dy === -state.direction.dy) {
    return { ...state.direction };
  }
  return { ...p };
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {{dx:number,dy:number}} d
 */
export function peekNewHead(state, d) {
  const h = state.snake[0];
  if (!h) return { x: 0, y: 0 };
  return { x: h.x + d.dx, y: h.y + d.dy };
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {{dx:number,dy:number}} d
 * @param {boolean} grow
 */
export function stepSnakePosition(state, d, grow) {
  state.direction = { ...d };
  const h = state.snake[0];
  if (!h) return;
  const newHead = { x: h.x + d.dx, y: h.y + d.dy };
  state.snake.unshift(newHead);
  if (!grow) state.snake.pop();
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {{dx:number,dy:number}} d
 */
export function willEatAfterStep(state, d) {
  const nh = peekNewHead(state, d);
  return nh.x === state.food.x && nh.y === state.food.y;
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {{x:number,y:number}} pos
 */
export function setDirection(state, pos) {
  const { dx, dy } = pos;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return;
  state.pendingDir = { dx, dy };
}

/**
 * Self-collision: хвост освобождает клетку, если змейка не растёт.
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {{x:number,y:number}} newHead
 * @param {boolean} willGrow
 */
export function isBodyCollision(newHead, state, willGrow) {
  const s = state.snake;
  for (let i = 1; i < s.length; i += 1) {
    if (s[i].x === newHead.x && s[i].y === newHead.y) {
      if (i === s.length - 1 && !willGrow) return false;
      return true;
    }
  }
  return false;
}
