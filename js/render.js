import { GRID_COLS, GRID_ROWS } from "./constants.js";

const COLOR_BG = "rgba(8,9,12,0.35)";
const GRID = "rgba(255,255,255,0.045)";
const SNAKE_HEAD_1 = "#e7d3a7";
const SNAKE_HEAD_2 = "#b8935a";
const SNAKE_BODY_1 = "#c9a96e";
const SNAKE_BODY_2 = "#8a7348";
const FOOD_CORE = "rgba(231,211,167,0.95)";
const FOOD_GLOW = "rgba(201,169,110,0.6)";

/**
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<import("./state.js").createGameState>} state
 * @param {number} timeMs
 */
export function drawFrame(canvas, state, timeMs) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  const pad = 0.5;

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_COLS; x += 1) {
    const px = x * cellW;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y += 1) {
    const py = y * cellH;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }

  const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(timeMs * 0.006));
  const fx = state.food.x * cellW + cellW * 0.5;
  const fy = state.food.y * cellH + cellH * 0.5;
  const rBase = (Math.min(cellW, cellH) * 0.28) * (0.92 + 0.12 * pulse);

  const gFood = ctx.createRadialGradient(fx, fy, 0, fx, fy, rBase * 2.4);
  gFood.addColorStop(0, `rgba(231,211,167,${0.35 + 0.25 * pulse})`);
  gFood.addColorStop(0.4, FOOD_GLOW);
  gFood.addColorStop(1, "rgba(201,169,110,0)");
  ctx.fillStyle = gFood;
  ctx.beginPath();
  ctx.arc(fx, fy, rBase * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = FOOD_CORE;
  ctx.shadowColor = "rgba(201,169,110,0.85)";
  ctx.shadowBlur = 12 * pulse;
  ctx.beginPath();
  ctx.arc(fx, fy, rBase, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const snake = state.snake;
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const seg = snake[i];
    const isHead = i === 0;
    const x = seg.x * cellW;
    const y = seg.y * cellH;
    const cw = cellW - pad * 2;
    const ch = cellH - pad * 2;
    const r = isHead ? Math.min(cw, ch) * 0.38 : Math.min(cw, ch) * 0.32;
    const ox = x + pad;
    const oy = y + pad;

    const grd = ctx.createLinearGradient(ox, oy, ox + cw, oy + ch);
    if (isHead) {
      grd.addColorStop(0, SNAKE_HEAD_1);
      grd.addColorStop(1, SNAKE_HEAD_2);
    } else {
      const t = i / Math.max(snake.length, 1);
      grd.addColorStop(0, lerpColor(SNAKE_BODY_1, SNAKE_BODY_2, t * 0.35));
      grd.addColorStop(1, lerpColor(SNAKE_HEAD_2, SNAKE_BODY_2, 0.2 + t * 0.5));
    }
    ctx.fillStyle = grd;
    if (isHead) {
      ctx.shadowColor = "rgba(201,169,110,0.5)";
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = "rgba(201,169,110,0.15)";
      ctx.shadowBlur = 4;
    }
    roundRect(ctx, ox + cw * 0.06, oy + ch * 0.06, cw * 0.88, ch * 0.88, r);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function lerpColor(a, b, t) {
  const ap = parseHex(a);
  const bp = parseHex(b);
  const c = (i) => (ap[i] + (bp[i] - ap[i]) * t) | 0;
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

function parseHex(s) {
  const h = s.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
