import { STORAGE_KEY } from "./constants.js";

export function loadBest() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = parseInt(v || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * @param {number} score
 */
export function saveBestIfNeeded(score) {
  try {
    const prev = loadBest();
    if (score > prev) {
      localStorage.setItem(STORAGE_KEY, String(score));
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
