import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { setDirection } from "./snake.js";

const KEY_MAP = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  w: { dx: 0, dy: -1 },
  s: { dx: 0, dy: 1 },
  a: { dx: -1, dy: 0 },
  d: { dx: 1, dy: 0 },
  W: { dx: 0, dy: -1 },
  S: { dx: 0, dy: 1 },
  A: { dx: -1, dy: 0 },
  D: { dx: 1, dy: 0 },
};

function directionFromKeyEvent(e) {
  let m = KEY_MAP[e.key] || KEY_MAP[e.code];
  if (!m && e.keyCode) {
    const kc = e.keyCode;
    if (kc === 38) m = { dx: 0, dy: -1 };
    else if (kc === 40) m = { dx: 0, dy: 1 };
    else if (kc === 37) m = { dx: -1, dy: 0 };
    else if (kc === 39) m = { dx: 1, dy: 0 };
  }
  return m || null;
}

/**
 * @param {ReturnType<import("./state.js").createGameState>} gameState
 * @param {() => boolean} isPlaying
 */
export function bindKeyboard(gameState, isPlaying) {
  const onKey = (e) => {
    if (!isPlaying()) return;
    const m = directionFromKeyEvent(e);
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    setDirection(gameState, m);
  };
  window.addEventListener("keydown", onKey, true);
  return () => window.removeEventListener("keydown", onKey, true);
}

const SWIPE_MIN = 28;

/**
 * @param {HTMLElement} el
 * @param {ReturnType<import("./state.js").createGameState>} gameState
 * @param {() => boolean} isPlaying
 */
export function bindTouchSwipe(el, gameState, isPlaying) {
  let sx = 0;
  let sy = 0;
  const onStart = (e) => {
    const t = e.changedTouches[0];
    sx = t.clientX;
    sy = t.clientY;
  };
  const onEnd = (e) => {
    if (!isPlaying()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < SWIPE_MIN && ay < SWIPE_MIN) return;
    if (ax > ay) {
      setDirection(gameState, dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 });
    } else {
      setDirection(gameState, dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 });
    }
  };
  el.addEventListener("touchstart", onStart, { passive: true });
  el.addEventListener("touchend", onEnd, { passive: true });
  return () => {
    el.removeEventListener("touchstart", onStart);
    el.removeEventListener("touchend", onEnd);
  };
}

const DIR_PAD = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import("./state.js").createGameState>} gameState
 * @param {() => boolean} isPlaying
 */
export function bindDPad(root, gameState, isPlaying) {
  const onClick = (e) => {
    const btn = e.target && e.target.closest("[data-dir]");
    if (!btn) return;
    const dir = btn.getAttribute("data-dir");
    if (!dir || !DIR_PAD[dir]) return;
    if (!isPlaying()) return;
    e.preventDefault();
    setDirection(gameState, DIR_PAD[dir]);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Клик / касание по canvas: направление к кликнутой клетке (мышь, тач, стилус).
 * Свайп на поле (bindTouchSwipe) остаётся как доп. способ.
 */
export function bindCanvasPointer(canvas, gameState, isPlaying) {
  const opts = { passive: false, capture: true };
  const applyAt = (clientX, clientY) => {
    if (!isPlaying()) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    const col = Math.floor(nx * GRID_COLS);
    const row = Math.floor(ny * GRID_ROWS);
    const c = Math.max(0, Math.min(GRID_COLS - 1, col));
    const r = Math.max(0, Math.min(GRID_ROWS - 1, row));
    const h = gameState.snake[0];
    if (!h) return;
    const dCol = c - h.x;
    const dRow = r - h.y;
    if (dCol === 0 && dRow === 0) return;
    if (Math.abs(dCol) >= Math.abs(dRow)) {
      setDirection(gameState, dCol > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 });
    } else {
      setDirection(gameState, dRow > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 });
    }
  };
  const onPointerLike = (e) => {
    if (e.isPrimary === false) return;
    if (e.button > 0) return;
    if (!isPlaying()) return;
    e.preventDefault();
    applyAt(e.clientX, e.clientY);
  };
  const onTouch = (e) => {
    if (!e.touches || e.touches.length < 1) return;
    if (e.isPrimary === false) return;
    if (!isPlaying()) return;
    e.preventDefault();
    applyAt(e.touches[0].clientX, e.touches[0].clientY);
  };
  if (window.PointerEvent) {
    canvas.addEventListener("pointerdown", onPointerLike, opts);
  } else {
    canvas.addEventListener("mousedown", onPointerLike, opts);
    canvas.addEventListener("touchstart", onTouch, opts);
  }
  return () => {
    if (window.PointerEvent) {
      canvas.removeEventListener("pointerdown", onPointerLike, opts);
    } else {
      canvas.removeEventListener("mousedown", onPointerLike, opts);
      canvas.removeEventListener("touchstart", onTouch, opts);
    }
  };
}
