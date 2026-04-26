/** Сетка и скорость */
export const GRID_COLS = 20;
export const GRID_ROWS = 20;
/** Стартовый интервал шага (чем больше — тем медленнее змейка) */
export const BASE_TICK_MS = 222;
/** Минимальный интервал (максимальная скорость в раунде) */
export const MIN_TICK_MS = 92;
/** На столько мс уменьшается интервал после каждой съеденной еды (ускорение по нарастающей) */
export const TICK_ACCEL_PER_FOOD_MS = 2;
/** Каждый новый раунд в сессии начинает чуть быстрее (мс снято с начального интервала) */
export const ROUND_RAMP_MS = 4;
export const MAX_ROUND_RAMP_STEPS = 14;
/** Нижняя граница стартового интервала раунда (не начинать слишком быстро) */
export const MIN_INITIAL_TICK_MS = MIN_TICK_MS + 32;

export const STORAGE_KEY = "snake-zmeyka-best-v1";
