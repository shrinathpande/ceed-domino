/**
 * State Manager — LocalStorage-backed reactive state for CEED Domino Tracker.
 * Dispatches 'state-changed' CustomEvent on document whenever state updates.
 */

const STORAGE_KEY = 'ceed_domino_state_v2';

const DEFAULT_STATE = {
  shields: 2,
  days: {},
  settings: {
    startDate: '2026-10-22',
    endDate: '2027-01-17',
    theme: 'system', // 'light' | 'dark' | 'system'
    customDominos: null, // null = use defaults
  },
};

let _state = null;

/** Load state from LocalStorage or return defaults */
export function loadState() {
  if (_state) return _state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults for forward-compat
      _state = { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) } };
    } else {
      _state = structuredClone(DEFAULT_STATE);
    }
  } catch {
    _state = structuredClone(DEFAULT_STATE);
  }
  return _state;
}

/** Save current state to LocalStorage and dispatch change event */
export function saveState() {
  if (!_state) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  document.dispatchEvent(new CustomEvent('state-changed', { detail: _state }));
}

/** Get current state (read-only reference) */
export function getState() {
  return _state || loadState();
}

/** Ensure a day record exists for the given date string */
export function ensureDayRecord(dateStr) {
  const state = getState();
  if (!state.days[dateStr]) {
    state.days[dateStr] = {
      completed: {},
      durations: {}, // e.g. { d1: 120, d3: 150 }
      emergency: false,
      shieldUsed: false,
      wakeTimestamp: null,
      examLog: null,
    };
  } else {
    if (state.days[dateStr].durations === undefined) {
      state.days[dateStr].durations = {};
    }
    if (state.days[dateStr].examLog === undefined) {
      state.days[dateStr].examLog = null;
    }
  }
  return state.days[dateStr];
}

/** Get actual logged duration (in minutes) for a domino on a specific date */
export function getDominoDuration(dominoId, dateStr, defaultMinutes = 0) {
  const day = ensureDayRecord(dateStr);
  if (day.durations && day.durations[dominoId] !== undefined) {
    return Number(day.durations[dominoId]);
  }
  if (day.completed && day.completed[dominoId]) {
    return defaultMinutes;
  }
  return 0;
}

/** Set actual logged duration (in minutes) for a domino on a specific date */
export function setDominoDuration(dominoId, dateStr, minutes) {
  const day = ensureDayRecord(dateStr);
  day.durations = day.durations || {};
  const cleanMins = Math.max(0, Math.round(Number(minutes)));
  day.durations[dominoId] = cleanMins;

  // If logging time > 0, ensure it is marked completed
  if (cleanMins > 0) {
    day.completed = day.completed || {};
    day.completed[dominoId] = true;
  }
  saveState();
  return cleanMins;
}

/** Calculate lifetime cumulative minutes logged for a specific domino across all days */
export function getCumulativeDominoMinutes(dominoId, dominosList = null) {
  const state = getState();
  let totalMinutes = 0;

  for (const date in state.days) {
    const day = state.days[date];
    if (!day) continue;

    if (day.durations && day.durations[dominoId] !== undefined) {
      totalMinutes += Number(day.durations[dominoId]);
    } else if (day.completed && day.completed[dominoId]) {
      // Fallback: if completed without explicit duration, use domino normal floor
      const targetDom = dominosList ? dominosList.find((d) => d.id === dominoId) : null;
      const floorMins = targetDom ? (day.emergency ? targetDom.emergencyMins : targetDom.normalMins) : 0;
      totalMinutes += floorMins;
    }
  }
  return totalMinutes;
}

/** Calculate grand total logged minutes across all MANDATORY DOMINO tasks across all days */
export function getGrandTotalLoggedMinutes(dominosList = null) {
  const state = getState();
  const dominos = dominosList || state.settings.customDominos || [
    { id: 'd1', badge: 'DOMINO 1', normalMins: 120, emergencyMins: 45 },
    { id: 'd2', badge: 'DOMINO 2', normalMins: 90, emergencyMins: 30 },
    { id: 'd3', badge: 'DOMINO 3', normalMins: 120, emergencyMins: 60 },
    { id: 'd4', badge: 'DOMINO 4', normalMins: 120, emergencyMins: 60 },
  ];
  const dominoMap = new Map();
  dominos
    .filter((d) => d.badge && d.badge.toUpperCase().includes('DOMINO'))
    .forEach((d) => dominoMap.set(d.id, d));

  let totalMinutes = 0;

  for (const date in state.days) {
    const day = state.days[date];
    if (!day) continue;

    for (const [id, dom] of dominoMap.entries()) {
      if (day.durations && day.durations[id] !== undefined) {
        totalMinutes += Number(day.durations[id]);
      } else if (day.completed && day.completed[id]) {
        const floorMins = day.emergency ? dom.emergencyMins : dom.normalMins;
        totalMinutes += floorMins;
      }
    }
  }
  return totalMinutes;
}

/** Format total minutes to decimal hours or hours+mins string (e.g. 14.5h or 14h 30m) */
export function formatHours(totalMinutes) {
  const hours = (totalMinutes / 60).toFixed(1);
  return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours}h`;
}

/** Format total minutes to detailed hours & minutes (e.g. "4h 15m") */
export function formatDetailedHours(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Count total completed mandatory DOMINO tasks across all historical days */
export function getAllCompletedTasksCount(dominosList = null) {
  const state = getState();
  const dominos = dominosList || state.settings.customDominos || [
    { id: 'd1', badge: 'DOMINO 1' },
    { id: 'd2', badge: 'DOMINO 2' },
    { id: 'd3', badge: 'DOMINO 3' },
    { id: 'd4', badge: 'DOMINO 4' },
  ];
  const dominoIds = new Set(
    dominos
      .filter((d) => d.badge && d.badge.toUpperCase().includes('DOMINO'))
      .map((d) => d.id)
  );

  let count = 0;
  for (const date in state.days) {
    const day = state.days[date];
    if (day && day.completed) {
      for (const id in day.completed) {
        if (dominoIds.has(id)) {
          count++;
        }
      }
    }
  }
  return count;
}

/** Get exam session log for date */
export function getExamLog(dateStr) {
  const day = ensureDayRecord(dateStr);
  return day.examLog;
}

/** Save exam session log for date */
export function saveExamSession(dateStr, sessionData) {
  const state = getState();
  const day = ensureDayRecord(dateStr);
  day.examLog = {
    updatedAt: Date.now(),
    ...sessionData,
  };
  saveState();
  return day.examLog;
}

/** Export state as JSON blob for download */
export function exportStateAsJSON() {
  const state = getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ceed-domino-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import state from a JSON file */
export function importStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        _state = { ...DEFAULT_STATE, ...imported, settings: { ...DEFAULT_STATE.settings, ...(imported.settings || {}) } };
        saveState();
        resolve(true);
      } catch (err) {
        reject(new Error('Invalid backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/** Reset all state to defaults */
export function resetState() {
  _state = structuredClone(DEFAULT_STATE);
  saveState();
}

/** Update settings */
export function updateSettings(partial) {
  const state = getState();
  state.settings = { ...state.settings, ...partial };
  saveState();
}
