/**
 * Timer Engine — countdown timer with high-precision timestamp delta math.
 * Calculates exact remaining time from wall-clock timestamps so pause/resume,
 * background tabs, and browser sleeps never skew elapsed time.
 */
import { playDing } from '../utils/sound.js';

const TIMER_KEY = 'ceed_domino_active_timer';

let _interval = null;
let _onTick = null;
let _onComplete = null;

export function getTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTimerState(state) {
  if (state) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

/**
 * Calculate accurate remaining seconds.
 * If paused: remaining = totalSeconds - pausedElapsed.
 * If running: remaining = totalSeconds - (currentWallClock - startedAt - accumulatedPausedDuration).
 */
export function calcRemaining(state) {
  if (!state) return 0;
  
  if (state.pausedAt) {
    // When paused, pausedElapsed holds total active seconds spent before pause
    return Math.max(0, state.totalSeconds - (state.pausedElapsed || 0));
  }

  const now = Date.now();
  // Total real wall clock seconds elapsed since startedAt minus accumulated pause pauses
  const activeElapsed = Math.floor((now - state.startedAt - (state.accumulatedPauseMs || 0)) / 1000);
  return Math.max(0, state.totalSeconds - activeElapsed);
}

/** Start a new timer */
export function startTimer({ dominoId, dominoTitle, totalSeconds, onTick, onComplete }) {
  stopTimer();

  const timerState = {
    dominoId,
    dominoTitle,
    totalSeconds,
    startedAt: Date.now(),
    pausedAt: null,
    pausedElapsed: 0,
    accumulatedPauseMs: 0,
  };

  saveTimerState(timerState);
  _onTick = onTick;
  _onComplete = onComplete;

  // Immediate first tick
  tick();

  if (_interval) clearInterval(_interval);
  _interval = setInterval(() => tick(), 1000);
}

/** Resume an active or paused timer from LocalStorage */
export function resumePersistedTimer({ onTick, onComplete }) {
  const state = getTimerState();
  if (!state) return false;

  _onTick = onTick;
  _onComplete = onComplete;

  const remaining = calcRemaining(state);
  if (remaining <= 0) {
    stopTimer();
    return false;
  }

  if (state.pausedAt) {
    if (_onTick) _onTick(remaining, state);
  } else {
    tick();
    if (_interval) clearInterval(_interval);
    _interval = setInterval(() => tick(), 1000);
  }

  return true;
}

function tick() {
  const state = getTimerState();
  if (!state) {
    stopTimer();
    return;
  }

  if (state.pausedAt) {
    const rem = calcRemaining(state);
    if (_onTick) _onTick(rem, state);
    return;
  }

  const remaining = calcRemaining(state);

  if (_onTick) _onTick(remaining, state);

  if (remaining <= 0) {
    stopTimer();
    playDing();
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
    if (_onComplete) _onComplete(state);
  }
}

/** Toggle pause / resume */
export function togglePause() {
  const state = getTimerState();
  if (!state) return false;

  const now = Date.now();

  if (state.pausedAt) {
    // Resuming: add the duration of this pause to accumulatedPauseMs
    const pauseDuration = now - state.pausedAt;
    state.accumulatedPauseMs = (state.accumulatedPauseMs || 0) + pauseDuration;
    state.pausedAt = null;
    saveTimerState(state);

    tick();
    if (_interval) clearInterval(_interval);
    _interval = setInterval(() => tick(), 1000);
    return false; // is running
  } else {
    // Pausing: record pausedAt and lock in how many seconds were actively consumed
    const activeElapsed = Math.floor((now - state.startedAt - (state.accumulatedPauseMs || 0)) / 1000);
    state.pausedElapsed = Math.min(state.totalSeconds, Math.max(0, activeElapsed));
    state.pausedAt = now;
    saveTimerState(state);

    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }
    const rem = calcRemaining(state);
    if (_onTick) _onTick(rem, state);
    return true; // is paused
  }
}

export function stopTimer() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  saveTimerState(null);
  _onTick = null;
  _onComplete = null;
}

export function isTimerActive() {
  return !!getTimerState();
}

export function isTimerPaused() {
  const state = getTimerState();
  return state ? !!state.pausedAt : false;
}

export function getTimerRemaining() {
  const state = getTimerState();
  return state ? calcRemaining(state) : 0;
}

export function formatTimer(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
