import {
  BASE_TICK_MS,
  MIN_TICK_MS,
  TICK_ACCEL_PER_FOOD_MS,
  ROUND_RAMP_MS,
  MAX_ROUND_RAMP_STEPS,
  MIN_INITIAL_TICK_MS,
} from "./constants.js";
import { createGameState, resetGameState } from "./state.js";
import {
  getNextDirection,
  peekNewHead,
  stepSnakePosition,
  willEatAfterStep,
} from "./snake.js";
import { isOutOfBounds, isBodyCollision } from "./collisions.js";
import { placeFood } from "./food.js";
import { drawFrame } from "./render.js";
import { loadBest, saveBestIfNeeded } from "./storage.js";

/** @typedef {"idle"|"running"|"paused"|"over"} PlayPhase */

export const gameState = createGameState();

/** @type {PlayPhase} */
export let playPhase = "idle";

/** Номер раунда в текущей сессии (сброс при выходе в меню); влияет на стартовую скорость */
let sessionRoundIndex = 0;

let tickTimer = null;
/** @type {number | 0} */
let rafId = 0;

/** @type {HTMLCanvasElement | null} */
let canvas = null;

/** @type {(score: number) => void} */
let onScoreChange = () => {};

/** @type {() => void} */
let onEat = () => {};

/** @type {() => void} */
let onGameOver = () => {};

export function setCanvas(c) {
  canvas = c;
}

export function setCallbacks(api) {
  if (api.onScoreChange) onScoreChange = api.onScoreChange;
  if (api.onEat) onEat = api.onEat;
  if (api.onGameOver) onGameOver = api.onGameOver;
}

export function isRunning() {
  return playPhase === "running";
}

function clearTick() {
  if (tickTimer !== null) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
}

function scheduleTick() {
  clearTick();
  tickTimer = window.setTimeout(() => {
    tickTimer = null;
    runTick();
  }, gameState.tickMs);
}

function runTick() {
  if (playPhase !== "running") return;

  const d = getNextDirection(gameState);
  const nh = peekNewHead(gameState, d);
  const willGrow = willEatAfterStep(gameState, d);

  if (isOutOfBounds(nh)) {
    triggerGameOver();
    return;
  }
  if (isBodyCollision(nh, gameState, willGrow)) {
    triggerGameOver();
    return;
  }

  stepSnakePosition(gameState, d, willGrow);

  if (willGrow) {
    gameState.score += 1;
    gameState.tickMs = Math.max(
      MIN_TICK_MS,
      gameState.tickMs - TICK_ACCEL_PER_FOOD_MS
    );
    placeFood(gameState);
    onEat();
  }

  onScoreChange(gameState.score);
  scheduleTick();
}

function triggerGameOver() {
  clearTick();
  playPhase = "over";
  saveBestIfNeeded(gameState.score);
  gameState.highScore = loadBest();
  onGameOver();
}

function initialTickForSessionRound(roundOneBased) {
  const ramp = Math.min(roundOneBased - 1, MAX_ROUND_RAMP_STEPS) * ROUND_RAMP_MS;
  return Math.max(MIN_INITIAL_TICK_MS, BASE_TICK_MS - ramp);
}

export function startRound() {
  clearTick();
  resetGameState(gameState);
  sessionRoundIndex += 1;
  gameState.tickMs = initialTickForSessionRound(sessionRoundIndex);
  gameState.highScore = loadBest();
  placeFood(gameState);
  playPhase = "running";
  onScoreChange(gameState.score);
  scheduleTick();
}

export function pause() {
  if (playPhase !== "running") return;
  playPhase = "paused";
  clearTick();
}

export function resume() {
  if (playPhase !== "paused") return;
  playPhase = "running";
  scheduleTick();
}

export function togglePause() {
  if (playPhase === "running") pause();
  else if (playPhase === "paused") resume();
}

export function stopLoop() {
  clearTick();
  stopRenderLoop();
  playPhase = "idle";
  sessionRoundIndex = 0;
}

function stopRenderLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

export function startRenderLoop() {
  if (rafId) return;
  const frame = (t) => {
    if (canvas) drawFrame(canvas, gameState, t);
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}
