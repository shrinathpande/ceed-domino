/**
 * Timer Engine — countdown timer with background persistence.
 * Stores timer state in LocalStorage so page refresh doesn't lose progress.
 */
import { playDing } from '../utils/sound.js';

const TIMER_KEY = 'ceed_domino_active_timer';

let _interval = null;
let _onTick = null;
let _onComplete = null;

/** Get persisted timer state */
export function getTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save timer state */
function saveTimerState(state) {
  if (state) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

/** Start a new countdown timer */
export function startTimer({ dominoId, dominoTitle, totalSeconds, onTick, onComplete }) {
  stopTimer();

  const timerState = {
    dominoId,
    dominoTitle,
    totalSeconds,
    startedAt: Date.now(),
    pausedAt: null,
    pausedElapsed: 0,
  };

  saveTimerState(timerState);
  _onTick = onTick;
  _onComplete = onComplete;

  _interval = setInterval(() => tick(), 1000);
  tick(); // immediate first tick
}

/** Resume a persisted timer (after page reload) */
export function resumePersistedTimer({ onTick, onComplete }) {
  const state = getTimerState();
  if (!state) return false;

  _onTick = onTick;
  _onComplete = onComplete;

  if (!state.pausedAt) {
    _interval = setInterval(() => tick(), 1000);
    tick();
  } else {
    // It was paused — just set callbacks, don't start interval
    const remaining = calcRemaining(state);
    if (_onTick) _onTick(remaining, state);
  }
  return true;
}

/** Calculate remaining seconds */
function calcRemaining(state) {
  if (!state) return 0;
  const elapsed = state.pausedAt
    ? state.pausedElapsed
    : Math.floor((Date.now() - state.startedAt) / 1000) - state.pausedElapsed;
  return Math.max(0, state.totalSeconds - elapsed);
}

/** Internal tick handler */
function tick() {
  const state = getTimerState();
  if (!state || state.pausedAt) return;

  const remaining = calcRemaining(state);

  if (_onTick) _onTick(remaining, state);

  if (remaining <= 0) {
    stopTimer();
    playDing();
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
    if (_onComplete) _onComplete(state);
  }
}

/** Pause/resume toggle */
export function togglePause() {
  const state = getTimerState();
  if (!state) return false;

  if (state.pausedAt) {
    // Resume
    const pauseDuration = Date.now() - state.pausedAt;
    state.pausedElapsed += Math.floor(pauseDuration / 1000);
    state.pausedAt = null;
    saveTimerState(state);
    _interval = setInterval(() => tick(), 1000);
    tick();
    return false; // not paused
  } else {
    // Pause
    state.pausedAt = Date.now();
    saveTimerState(state);
    clearInterval(_interval);
    _interval = null;
    return true; // is paused
  }
}

/** Stop and clear timer */
export function stopTimer() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  saveTimerState(null);
  _onTick = null;
  _onComplete = null;
}

/** Check if timer is currently running */
export function isTimerActive() {
  return !!getTimerState();
}

/** Check if timer is paused */
export function isTimerPaused() {
  const state = getTimerState();
  return state ? !!state.pausedAt : false;
}

/** Get remaining seconds for the active timer */
export function getTimerRemaining() {
  const state = getTimerState();
  return state ? calcRemaining(state) : 0;
}

/** Format seconds to HH:MM:SS */
export function formatTimer(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
