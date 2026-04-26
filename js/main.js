import {
  setCanvas,
  setCallbacks,
  gameState,
  playPhase,
  startRound,
  pause,
  resume,
  startRenderLoop,
  stopLoop,
  isRunning,
} from "./game.js";
import { loadBest } from "./storage.js";
import { bindKeyboard, bindTouchSwipe, bindDPad, bindCanvasPointer } from "./input.js";

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

if (canvas) setCanvas(/** @type {HTMLCanvasElement} */ (canvas));

function updateHud() {
  if (hudScore) hudScore.textContent = String(gameState.score);
  if (hudBest) hudBest.textContent = String(gameState.highScore);
}

function isPlayingForInput() {
  return isRunning();
}

setCallbacks({
  onScoreChange: (s) => {
    if (hudScore) hudScore.textContent = String(s);
  },
  onEat: () => {
    if (gameBoard) {
      gameBoard.classList.add("is-flash");
      window.setTimeout(() => gameBoard.classList.remove("is-flash"), 200);
    }
  },
  onGameOver: () => {
    if (gameBoard) {
      gameBoard.classList.add("is-shake");
      window.setTimeout(() => gameBoard.classList.remove("is-shake"), 600);
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

bindKeyboard(gameState, isPlayingForInput);
if (gameBoard) bindTouchSwipe(gameBoard, gameState, isPlayingForInput);
if (touchPad) bindDPad(touchPad, gameState, isPlayingForInput);
if (canvas)
  bindCanvasPointer(/** @type {HTMLCanvasElement} */ (canvas), gameState, isPlayingForInput);

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

/**
 * Главный экран: название, описание, бейдж, «Начать игру».
 */
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
    } catch {
      gameBoard.focus();
    }
  } else if (canvas) {
    canvas.setAttribute("tabindex", "-1");
    try {
      canvas.focus({ preventScroll: true });
    } catch {
      canvas.focus();
    }
  }
}

btnStart?.addEventListener("click", () => {
  showGameView();
  if (overlayGameOver) overlayGameOver.hidden = true;
  showPauseUi(false);
  startRenderLoop();
  startRound();
  gameState.highScore = loadBest();
  updateHud();
  focusGameForKeys();
});

btnPause?.addEventListener("click", () => {
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

btnResume?.addEventListener("click", () => {
  if (playPhase === "paused") {
    resume();
    showPauseUi(false);
    focusGameForKeys();
  }
});

btnRestart?.addEventListener("click", () => {
  if (overlayGameOver) overlayGameOver.hidden = true;
  showPauseUi(false);
  startRound();
  gameState.highScore = loadBest();
  updateHud();
  focusGameForKeys();
});

btnPlayAgain?.addEventListener("click", () => {
  if (overlayGameOver) overlayGameOver.hidden = true;
  startRound();
  gameState.highScore = loadBest();
  updateHud();
  focusGameForKeys();
});

function goToMainScreen() {
  showStartView();
}

btnToMain?.addEventListener("click", goToMainScreen);

btnPauseToMain?.addEventListener("click", () => {
  if (playPhase === "paused") {
    goToMainScreen();
  }
});
