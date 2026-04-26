/**
 * Единый скрипт без import/export: работает при открытии index.html с диска (file://) и в узких путях.
 * Логика перенесена из модулей js/*.js
 */
(function () {
  "use strict";

  const GRID_COLS = 20;
  const GRID_ROWS = 20;
  const BASE_TICK_MS = 222;
  const MIN_TICK_MS = 92;
  const TICK_ACCEL_PER_FOOD_MS = 2;
  const ROUND_RAMP_MS = 4;
  const MAX_ROUND_RAMP_STEPS = 14;
  const MIN_INITIAL_TICK_MS = MIN_TICK_MS + 32;
  const STORAGE_KEY = "snake-zmeyka-best-v1";

  function createGameState() {
    return {
      snake: [],
      food: { x: 0, y: 0 },
      direction: { dx: 1, dy: 0 },
      pendingDir: { dx: 1, dy: 0 },
      score: 0,
      highScore: 0,
      tickMs: BASE_TICK_MS,
    };
  }

  function resetGameState(s) {
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

  function occupied(body, x, y) {
    return body.some(function (p) {
      return p.x === x && p.y === y;
    });
  }

  function getNextDirection(state) {
    const p = state.pendingDir;
    if (p.dx === -state.direction.dx && p.dy === -state.direction.dy) {
      return { dx: state.direction.dx, dy: state.direction.dy };
    }
    return { dx: p.dx, dy: p.dy };
  }

  function peekNewHead(state, d) {
    const h = state.snake[0];
    if (!h) return { x: 0, y: 0 };
    return { x: h.x + d.dx, y: h.y + d.dy };
  }

  function stepSnakePosition(state, d, grow) {
    state.direction = { dx: d.dx, dy: d.dy };
    const h = state.snake[0];
    if (!h) return;
    const newHead = { x: h.x + d.dx, y: h.y + d.dy };
    state.snake.unshift(newHead);
    if (!grow) state.snake.pop();
  }

  function willEatAfterStep(state, d) {
    const nh = peekNewHead(state, d);
    return nh.x === state.food.x && nh.y === state.food.y;
  }

  function setDirection(state, pos) {
    const dx = pos.dx;
    const dy = pos.dy;
    if (dx === 0 && dy === 0) return;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    state.pendingDir = { dx: dx, dy: dy };
  }

  function isBodyCollision(newHead, state, willGrow) {
    const s = state.snake;
    for (let i = 1; i < s.length; i += 1) {
      if (s[i].x === newHead.x && s[i].y === newHead.y) {
        if (i === s.length - 1 && !willGrow) return false;
        return true;
      }
    }
    return false;
  }

  function isOutOfBounds(nextHead) {
    return (
      nextHead.x < 0 ||
      nextHead.x >= GRID_COLS ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_ROWS
    );
  }

  function randomEmptyCell(state) {
    const snake = state.snake;
    const free = [];
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        if (!occupied(snake, x, y)) free.push({ x: x, y: y });
      }
    }
    if (free.length === 0) return null;
    return free[(Math.random() * free.length) | 0];
  }

  function placeFood(state) {
    const cell = randomEmptyCell(state);
    if (cell) state.food = cell;
  }

  function loadBest() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      const n = parseInt(v || "0", 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBestIfNeeded(score) {
    try {
      const prev = loadBest();
      if (score > prev) {
        localStorage.setItem(STORAGE_KEY, String(score));
        return true;
      }
    } catch (e) {}
    return false;
  }

  const COLOR_BG = "rgba(8,9,12,0.35)";
  const GRID_LINE = "rgba(255,255,255,0.045)";
  const SNAKE_HEAD_1 = "#e7d3a7";
  const SNAKE_HEAD_2 = "#b8935a";
  const SNAKE_BODY_1 = "#c9a96e";
  const SNAKE_BODY_2 = "#8a7348";
  const FOOD_CORE = "rgba(231,211,167,0.95)";
  const FOOD_GLOW = "rgba(201,169,110,0.6)";

  function drawFrame(canvas, state, timeMs) {
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
    ctx.strokeStyle = GRID_LINE;
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
    const rBase = Math.min(cellW, cellH) * 0.28 * (0.92 + 0.12 * pulse);
    const gFood = ctx.createRadialGradient(fx, fy, 0, fx, fy, rBase * 2.4);
    gFood.addColorStop(0, "rgba(231,211,167," + (0.35 + 0.25 * pulse) + ")");
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
      const sx = seg.x * cellW;
      const sy = seg.y * cellH;
      const cw = cellW - pad * 2;
      const ch = cellH - pad * 2;
      const r = isHead
        ? Math.min(cw, ch) * 0.38
        : Math.min(cw, ch) * 0.32;
      const ox = sx + pad;
      const oy = sy + pad;
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
      ctx.shadowColor = isHead
        ? "rgba(201,169,110,0.5)"
        : "rgba(201,169,110,0.15)";
      ctx.shadowBlur = isHead ? 10 : 4;
      roundRectPath(ctx, ox + cw * 0.06, oy + ch * 0.06, cw * 0.88, ch * 0.88, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function roundRectPath(ctx, x, y, rw, rh, r) {
    const rr = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
    ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
    ctx.arcTo(x, y + rh, x, y, rr);
    ctx.arcTo(x, y, x + rw, y, rr);
    ctx.closePath();
  }

  function lerpColor(a, b, t) {
    const ap = parseHex(a);
    const bp = parseHex(b);
    return (
      "rgb(" +
      ((ap[0] + (bp[0] - ap[0]) * t) | 0) +
      "," +
      ((ap[1] + (bp[1] - ap[1]) * t) | 0) +
      "," +
      ((ap[2] + (bp[2] - ap[2]) * t) | 0) +
      ")"
    );
  }

  function parseHex(s) {
    const h = s.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

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
  const SWIPE_MIN = 28;
  const DIR_PAD = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  const gameState = createGameState();
  let playPhase = "idle";
  var sessionRoundIndex = 0;
  let tickTimer = null;
  let rafId = 0;
  let canvasEl = null;
  let onScoreChange = function () {};
  let onEat = function () {};
  let onGameOver = function () {};

  function isRunning() {
    return playPhase === "running";
  }

  function setCanvas(c) {
    canvasEl = c;
  }

  function setCallbacks(api) {
    if (api.onScoreChange) onScoreChange = api.onScoreChange;
    if (api.onEat) onEat = api.onEat;
    if (api.onGameOver) onGameOver = api.onGameOver;
  }

  function clearTick() {
    if (tickTimer !== null) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

  function scheduleTick() {
    clearTick();
    tickTimer = window.setTimeout(function () {
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
    var ramp = Math.min(roundOneBased - 1, MAX_ROUND_RAMP_STEPS) * ROUND_RAMP_MS;
    return Math.max(MIN_INITIAL_TICK_MS, BASE_TICK_MS - ramp);
  }

  function startRound() {
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

  function pause() {
    if (playPhase !== "running") return;
    playPhase = "paused";
    clearTick();
  }

  function resume() {
    if (playPhase !== "paused") return;
    playPhase = "running";
    scheduleTick();
  }

  function stopRenderLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function stopLoop() {
    clearTick();
    stopRenderLoop();
    playPhase = "idle";
    sessionRoundIndex = 0;
  }

  function startRenderLoop() {
    if (rafId) return;
    function frame(t) {
      if (canvasEl) drawFrame(canvasEl, gameState, t);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  const viewStart = document.getElementById("viewStart");
  const viewGame = document.getElementById("viewGame");
  const gameBoard = document.getElementById("gameBoard");
  const canvas = document.getElementById("gameCanvas");
  const hudScore = document.getElementById("hudScore");
  const hudBest = document.getElementById("hudBest");
  const btnStart = document.getElementById("btnStart");
  const btnPause = document.getElementById("btnPause");
  const btnRestart = document.getElementById("btnRestart");
  const overlayPause = document.getElementById("overlayPause");
  const overlayGameOver = document.getElementById("overlayGameOver");
  const btnResume = document.getElementById("btnResume");
  const btnPlayAgain = document.getElementById("btnPlayAgain");
  const btnToMain = document.getElementById("btnToMain");
  const btnPauseToMain = document.getElementById("btnPauseToMain");
  const goScore = document.getElementById("goScore");
  const goBest = document.getElementById("goBest");
  const touchPad = document.getElementById("touchPad");

  if (canvas) {
    setCanvas(/** @type {HTMLCanvasElement} */ (canvas));
  }

  function updateHud() {
    if (hudScore) hudScore.textContent = String(gameState.score);
    if (hudBest) hudBest.textContent = String(gameState.highScore);
  }

  setCallbacks({
    onScoreChange: function (s) {
      if (hudScore) hudScore.textContent = String(s);
    },
    onEat: function () {
      if (gameBoard) {
        gameBoard.classList.add("is-flash");
        window.setTimeout(function () {
          gameBoard.classList.remove("is-flash");
        }, 200);
      }
    },
    onGameOver: function () {
      if (gameBoard) {
        gameBoard.classList.add("is-shake");
        window.setTimeout(function () {
          gameBoard.classList.remove("is-shake");
        }, 600);
      }
      if (overlayGameOver) {
        overlayGameOver.hidden = false;
        if (goScore) goScore.textContent = String(gameState.score);
        if (goBest) goBest.textContent = String(gameState.highScore);
      }
    },
  });

  gameState.highScore = loadBest();
  updateHud();

  function isPlayingForInput() {
    return isRunning();
  }

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

  function bindKeyboard(gameState, isPlaying) {
    function onKey(e) {
      if (!isPlaying()) return;
      const m = directionFromKeyEvent(e);
      if (!m) return;
      e.preventDefault();
      e.stopPropagation();
      setDirection(gameState, m);
    }
    window.addEventListener("keydown", onKey, true);
  }

  function bindTouchSwipe(el, gameState, isPlaying) {
    let sx = 0;
    let sy = 0;
    function onStart(e) {
      const t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
    }
    function onEnd(e) {
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
        setDirection(
          gameState,
          dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 }
        );
      }
    }
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
  }

  function bindDPad(root, gameState, isPlaying) {
    function onClick(e) {
      const btn = e.target && e.target.closest("[data-dir]");
      if (!btn) return;
      const dir = btn.getAttribute("data-dir");
      if (!dir || !DIR_PAD[dir]) return;
      if (!isPlaying()) return;
      e.preventDefault();
      setDirection(gameState, DIR_PAD[dir]);
    }
    root.addEventListener("click", onClick);
  }

  function directionFromPoint(state, col, row) {
    const h = state.snake[0];
    if (!h) return;
    const c = Math.max(0, Math.min(GRID_COLS - 1, col));
    const r = Math.max(0, Math.min(GRID_ROWS - 1, row));
    const dCol = c - h.x;
    const dRow = r - h.y;
    if (dCol === 0 && dRow === 0) return;
    if (Math.abs(dCol) >= Math.abs(dRow)) {
      setDirection(state, dCol > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 });
    } else {
      setDirection(state, dRow > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 });
    }
  }

  function bindCanvasPointer(canvas, state, isPlaying) {
    var opts = { passive: false, capture: true };
    function applyAt(clientX, clientY) {
      if (!isPlaying()) return;
      var rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      var nx = (clientX - rect.left) / rect.width;
      var ny = (clientY - rect.top) / rect.height;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
      var col = Math.floor(nx * GRID_COLS);
      var row = Math.floor(ny * GRID_ROWS);
      directionFromPoint(state, col, row);
    }
    function onPointerLike(e) {
      if (e.isPrimary === false) return;
      if (e.button > 0) return;
      if (!isPlaying()) return;
      e.preventDefault();
      applyAt(e.clientX, e.clientY);
    }
    function onTouch(e) {
      if (!e.touches || e.touches.length < 1) return;
      if (e.isPrimary === false) return;
      if (!isPlaying()) return;
      e.preventDefault();
      var t = e.touches[0];
      applyAt(t.clientX, t.clientY);
    }
    if (window.PointerEvent) {
      canvas.addEventListener("pointerdown", onPointerLike, opts);
    } else {
      canvas.addEventListener("mousedown", onPointerLike, opts);
      canvas.addEventListener("touchstart", onTouch, opts);
    }
  }

  bindKeyboard(gameState, isPlayingForInput);
  if (gameBoard) bindTouchSwipe(gameBoard, gameState, isPlayingForInput);
  if (touchPad) bindDPad(touchPad, gameState, isPlayingForInput);
  if (canvas) bindCanvasPointer(/** @type {HTMLCanvasElement} */ (canvas), gameState, isPlayingForInput);

  const mq = window.matchMedia("(max-width: 599px)");
  function syncTouchPad() {
    if (touchPad) {
      touchPad.classList.toggle("touch-pad--visible", mq.matches);
    }
  }
  syncTouchPad();
  mq.addEventListener("change", syncTouchPad);

  function showPauseUi(on) {
    if (overlayPause) overlayPause.hidden = !on;
  }

  function showGameView() {
    if (viewStart) viewStart.setAttribute("hidden", "");
    if (viewGame) viewGame.removeAttribute("hidden");
    syncTouchPad();
  }

  function showStartView() {
    if (overlayGameOver) overlayGameOver.hidden = true;
    showPauseUi(false);
    if (viewGame) viewGame.setAttribute("hidden", "");
    if (viewStart) {
      viewStart.removeAttribute("hidden");
      const inner = viewStart.querySelector(".view__inner--start");
      if (inner) {
        inner.classList.remove("fade-in");
        void inner.offsetWidth;
        inner.classList.add("fade-in");
      }
    }
    stopLoop();
    gameState.highScore = loadBest();
    updateHud();
  }

  function focusGameForKeys() {
    if (gameBoard) {
      if (!gameBoard.getAttribute("tabindex")) {
        gameBoard.setAttribute("tabindex", "-1");
      }
      try {
        gameBoard.focus({ preventScroll: true });
      } catch (err) {
        gameBoard.focus();
      }
    } else if (canvas) {
      canvas.setAttribute("tabindex", "-1");
      try {
        canvas.focus({ preventScroll: true });
      } catch (err) {
        canvas.focus();
      }
    }
  }

  if (btnStart) {
    btnStart.addEventListener("click", function () {
      showGameView();
      if (overlayGameOver) overlayGameOver.hidden = true;
      showPauseUi(false);
      startRenderLoop();
      startRound();
      gameState.highScore = loadBest();
      updateHud();
      focusGameForKeys();
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", function () {
      if (playPhase === "over") return;
      if (playPhase === "running") {
        pause();
        showPauseUi(true);
      } else if (playPhase === "paused") {
        resume();
        showPauseUi(false);
        focusGameForKeys();
      }
    });
  }

  if (btnResume) {
    btnResume.addEventListener("click", function () {
      if (playPhase === "paused") {
        resume();
        showPauseUi(false);
        focusGameForKeys();
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener("click", function () {
      if (overlayGameOver) overlayGameOver.hidden = true;
      showPauseUi(false);
      startRound();
      gameState.highScore = loadBest();
      updateHud();
      focusGameForKeys();
    });
  }

  if (btnPlayAgain) {
    btnPlayAgain.addEventListener("click", function () {
      if (overlayGameOver) overlayGameOver.hidden = true;
      startRound();
      gameState.highScore = loadBest();
      updateHud();
      focusGameForKeys();
    });
  }

  function goToMainScreen() {
    showStartView();
  }

  if (btnToMain) {
    btnToMain.addEventListener("click", goToMainScreen);
  }

  if (btnPauseToMain) {
    btnPauseToMain.addEventListener("click", function () {
      if (playPhase === "paused") {
        goToMainScreen();
      }
    });
  }
})();
