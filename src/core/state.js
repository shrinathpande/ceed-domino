/**
 * State Manager — LocalStorage-backed reactive state for CEED Domino Tracker.
 * Dispatches 'state-changed' CustomEvent on document whenever state updates.
 */

const STORAGE_KEY = 'ceed_domino_state_v2';

const DEFAULT_STATE = {
  shields: 2,
  xp: 0,
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
      emergency: false,
      shieldUsed: false,
      wakeTimestamp: null,
    };
  }
  return state.days[dateStr];
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
