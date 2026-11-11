// src/core/state.js
import { playRelayClick } from '../utils/sound.js';
import { getDevDataset, WORST_CASE_BLOCKS, ONE_BLOCK, get1000Blocks } from '../utils/dev-fixtures.js';

export const STATE_KEY = 'ceed_v2_state';
export const BLOCKS_KEY = 'ceed_v2_blocks';
export const ALARMS_KEY = 'ceed_v2_alarms';
export const THEME_KEY = 'ceed_v2_theme';
const LEGACY_STORAGE_KEY = 'ceed_domino_state_v2';

export const THEMES = [
  { id: 'oled', label: 'OLED', name: 'AMOLED Pitch-Black' },
  { id: 'cyber', label: 'DARK', name: 'Charcoal Dark' }
];

export const DEFAULT_BLOCKS = [
  { id: 'd1', badge: 'DOMINO 1', name: 'Walk & Fitness', category: 'WALK', targetMins: 90 },
  { id: 'd2', badge: 'DOMINO 2', name: 'Study & Sketching', category: 'STUDY', targetMins: 120 },
  { id: 'd3', badge: 'DOMINO 3', name: 'Paperwork & CEED Sprint', category: 'STUDY', targetMins: 180 },
  { id: 'd4', badge: 'DOMINO 4', name: 'Work & Studio Output', category: 'WORK', targetMins: 240 }
];

const DEFAULT_SETTINGS = {
  startDate: '2026-10-22',
  endDate: '2027-01-17',
  theme: 'oled',
  accentColor: '#C4B5FD',
  cardInfusion: 'all'
};

// Core architectural invariant: any block with 'DOMINO' in badge is mandatory
export function isDominoTask(block) {
  if (!block || !block.badge) return false;
  return block.badge.toUpperCase().includes('DOMINO');
}

export function getBlocks() {
  const dataset = getDevDataset();
  if (dataset === 'worst') return structuredClone(WORST_CASE_BLOCKS);
  if (dataset === 'empty') return [];
  if (dataset === 'one') return structuredClone(ONE_BLOCK);
  if (dataset === '1000') return get1000Blocks();

  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    if (!raw) return structuredClone(DEFAULT_BLOCKS);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(DEFAULT_BLOCKS);
    // Guarantee numeric targetMins on every block
    return parsed.map((b, idx) => ({
      id: b.id || `d${idx + 1}`,
      badge: b.badge || `DOMINO ${idx + 1}`,
      name: b.name || `Block ${idx + 1}`,
      category: b.category || 'STUDY',
      targetMins: Number(b.targetMins || b.floor || 60),
      hasPartACounter: !!b.hasPartACounter
    }));
  } catch {
    return structuredClone(DEFAULT_BLOCKS);
  }
}

export function saveBlocks(blocks) {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  document.dispatchEvent(new CustomEvent('blocks-changed', { detail: blocks }));
}

let _stateCache = null;

// Normalize day record data to prevent type errors (e.g. object vs array for completed)
function normalizeDayRecord(rec) {
  if (!rec || typeof rec !== 'object') {
    rec = {};
  }
  if (!rec.durations || typeof rec.durations !== 'object') {
    rec.durations = {};
  }
  if (Array.isArray(rec.completed)) {
    // Already an array
  } else if (rec.completed && typeof rec.completed === 'object') {
    // Legacy object format: { d1: true, d2: false }
    rec.completed = Object.keys(rec.completed).filter(k => rec.completed[k]);
  } else {
    rec.completed = [];
  }
  if (!Array.isArray(rec.logs)) {
    rec.logs = [];
  }
  if (!Array.isArray(rec.customMins)) {
    rec.customMins = [];
  }
  if (typeof rec.partACount !== 'number' || isNaN(rec.partACount)) {
    rec.partACount = 0;
  }
  if (typeof rec.partABonusClaimed !== 'boolean') {
    rec.partABonusClaimed = false;
  }
  rec.emergency = !!rec.emergency;
  rec.shieldUsed = !!rec.shieldUsed;
  return rec;
}

/** Load state or migrate from legacy ceed_domino_state_v2 */
export function getState() {
  if (_stateCache) return _stateCache;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalizedRecords = {};
      for (const [d, r] of Object.entries(parsed.records || {})) {
        normalizedRecords[d] = normalizeDayRecord(r);
      }
      _stateCache = {
        records: normalizedRecords,
        streak: parsed.streak || 0,
        bestStreak: parsed.bestStreak || 0,
        shields: parsed.shields !== undefined ? parsed.shields : 2,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
      };
      return _stateCache;
    }

    // Attempt automatic seamless migration from legacy storage key
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const migratedRecords = {};

      if (legacy.days && typeof legacy.days === 'object') {
        for (const [dateStr, dayData] of Object.entries(legacy.days)) {
          const completedArr = [];
          if (dayData.completed && typeof dayData.completed === 'object') {
            for (const [k, v] of Object.entries(dayData.completed)) {
              if (v) completedArr.push(k);
            }
          }
          migratedRecords[dateStr] = {
            durations: dayData.durations || {},
            completed: completedArr,
            logs: [],
            customMins: [],
            partACount: 0,
            partABonusClaimed: false,
            emergency: !!dayData.emergency,
            shieldUsed: !!dayData.shieldUsed
          };
        }
      }

      _stateCache = {
        records: migratedRecords,
        streak: 0,
        bestStreak: 0,
        shields: legacy.shields !== undefined ? legacy.shields : 2,
        settings: { ...DEFAULT_SETTINGS, ...(legacy.settings || {}) }
      };

      recalculateStreak(_stateCache);
      saveState(_stateCache);
      return _stateCache;
    }

    _stateCache = {
      records: {},
      streak: 0,
      bestStreak: 0,
      shields: 2,
      settings: structuredClone(DEFAULT_SETTINGS)
    };
    return _stateCache;
  } catch {
    _stateCache = {
      records: {},
      streak: 0,
      bestStreak: 0,
      shields: 2,
      settings: structuredClone(DEFAULT_SETTINGS)
    };
    return _stateCache;
  }
}

export function loadState() {
  return getState();
}

export function saveState(state = _stateCache) {
  if (!state) return;
  _stateCache = state;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent('state-changed', { detail: state }));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function getDayRecord(dateStr) {
  const dataset = getDevDataset();
  if (dataset === 'worst') {
    return {
      durations: {
        d1_worst: 1284,
        d2_worst: 0,
        d3_worst: 60,
        d4_worst: 0.3
      },
      completed: ['d1_worst', 'd3_worst'],
      logs: [
        { id: 'log_1', time: '04:12', hour24: 4, blockId: 'd1_worst', category: 'INTERNATIONAL_COGNITIVE_STUDIO_RESEARCH_AND_DEVELOPMENT', mins: 1284, label: 'Đặng Thị Ngọc Hân Marathon' }
      ],
      customMins: [],
      partACount: 1,
      partABonusClaimed: false,
      emergency: false,
      shieldUsed: false,
      notes: {
        d1_worst: 'Line one\nLine two with a 2,000-character description <script>alert(1)</script> bartholomew.fitzgerald@northwind-industries-holdings.example.com'
      }
    };
  }
  if (dataset === 'empty') {
    return {
      durations: {},
      completed: [],
      logs: [],
      customMins: [],
      partACount: 0,
      partABonusClaimed: false,
      emergency: false,
      shieldUsed: false,
      notes: {}
    };
  }
  if (dataset === 'one') {
    return {
      durations: { d1_one: 60 },
      completed: ['d1_one'],
      logs: [],
      customMins: [],
      partACount: 1,
      partABonusClaimed: false,
      emergency: false,
      shieldUsed: false,
      notes: {}
    };
  }

  const state = getState();
  if (!state.records[dateStr]) {
    state.records[dateStr] = {
      durations: {},
      completed: [],
      logs: [],
      customMins: [],
      partACount: 0,
      partABonusClaimed: false,
      emergency: false,
      shieldUsed: false
    };
    saveState(state);
  } else {
    state.records[dateStr] = normalizeDayRecord(state.records[dateStr]);
  }
  return state.records[dateStr];
}

export function ensureDayRecord(dateStr) {
  return getDayRecord(dateStr);
}

// Time-independent logger with automatic Domino checkoff
export function logHours(dateStr, blockId, deltaMins, customLabel = null) {
  const state = getState();
  const blocks = getBlocks();
  const block = blocks.find(b => b.id === blockId);
  if (!block) return;

  const rec = getDayRecord(dateStr);
  const prev = Number(rec.durations[blockId]) || 0;
  const next = Math.max(0, prev + Number(deltaMins));
  rec.durations[blockId] = next;

  // Record timestamped log entry regardless of time of day
  if (deltaMins !== 0) {
    const now = new Date();
    const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    rec.logs.unshift({
      id: 'log_' + Date.now(),
      time: nowTime,
      hour24: now.getHours(),
      blockId,
      category: block.category,
      mins: deltaMins,
      label: customLabel || block.name
    });
  }

  // Auto-complete Domino when target floor is met, uncheck if below
  const effectiveTarget = rec.emergency ? Math.ceil(block.targetMins / 2) : block.targetMins;
  if (next >= effectiveTarget) {
    if (!rec.completed.includes(blockId)) {
      rec.completed.push(blockId);
    }
  } else {
    rec.completed = rec.completed.filter(id => id !== blockId);
  }

  recalculateStreak(state);
  saveState(state);
  playRelayClick();
  return rec;
}

// Daily 35-Question Part A Micro-Counter with Auto +1.0h Study Reward
export function logPartAQuestions(dateStr, deltaQs, setExact = false) {
  const state = getState();
  const rec = getDayRecord(dateStr);

  const prev = rec.partACount || 0;
  const next = setExact ? Math.max(0, deltaQs) : Math.max(0, prev + deltaQs);
  rec.partACount = next;
  saveState(state);

  // Auto-reward +60m (1.0h) to Paperwork/CEED Domino ('d3') upon hitting 35/35
  if (next >= 35 && !rec.partABonusClaimed) {
    rec.partABonusClaimed = true;
    saveState(state);
    logHours(dateStr, 'd3', 60, '35/35 Part A Daily Target Complete');
  } else {
    playRelayClick();
  }

  return rec;
}

export function recalculateStreak(state) {
  const blocks = getBlocks();
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);
  if (mandatoryIds.length === 0) return;

  const dates = Object.keys(state.records).sort();
  let currentStreak = 0;
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const d of dates) {
    const rec = normalizeDayRecord(state.records[d]);
    const allDone = mandatoryIds.every(id => rec.completed.includes(id));
    if (allDone || rec.shieldUsed) {
      currentStreak += 1;
    } else if (d !== todayStr) {
      currentStreak = 0;
    }
  }

  state.streak = currentStreak;
  if (currentStreak > (state.bestStreak || 0)) {
    state.bestStreak = currentStreak;
  }
}

function parseHour24Fallback(logItem) {
  if (typeof logItem.hour24 === 'number') return logItem.hour24;
  if (!logItem.time) return 12;
  const match = logItem.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 12;
  let hr = parseInt(match[1], 10);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && hr < 12) hr += 12;
  if (ampm === 'AM' && hr === 12) hr = 0;
  return hr;
}

export function getCumulativeTelemetry() {
  const dataset = getDevDataset();
  if (dataset === 'worst') {
    return {
      cumulativeStudyHours: '984.5',
      cumulativeWorkHours: '1240.2',
      cumulativeWalkHours: '10120.9',
      totalProductiveHours: '12345.6',
      totalCompletedDominos: 1,
      totalPartASolved: 1,
      level: 1,
      streak: 1,
      bestStreak: 1284,
      peakWindows: [
        { key: 'NIGHT SPRINT (02:00–04:59)', label: 'NIGHT SPRINT (02:00–04:59)', hours: '1284.0', mins: 77040, pct: 142 },
        { key: 'AFTERNOON (12:00–16:59)', label: 'AFTERNOON (12:00–16:59)', hours: '300.0', mins: 18000, pct: 33 }
      ],
      topWindowName: 'NIGHT SPRINT (02:00–04:59) (142%)'
    };
  }
  if (dataset === 'empty') {
    return {
      cumulativeStudyHours: '0.0',
      cumulativeWorkHours: '0.0',
      cumulativeWalkHours: '0.0',
      totalProductiveHours: '0.0',
      totalCompletedDominos: 0,
      totalPartASolved: 0,
      level: 0,
      streak: 0,
      bestStreak: 0,
      peakWindows: [],
      topWindowName: 'NO DATA YET'
    };
  }
  if (dataset === 'one') {
    return {
      cumulativeStudyHours: '1.0',
      cumulativeWorkHours: '0.0',
      cumulativeWalkHours: '0.0',
      totalProductiveHours: '1.0',
      totalCompletedDominos: 1,
      totalPartASolved: 1,
      level: 1,
      streak: 1,
      bestStreak: 1,
      peakWindows: [{ key: 'WALK', label: 'WALK', hours: '1.0', mins: 60, pct: 100 }],
      topWindowName: 'WALK (100%)'
    };
  }

  const state = getState();
  const blocks = getBlocks();
  const blockMap = Object.fromEntries(blocks.map(b => [b.id, b]));

  let cumulativeStudyMins = 0;
  let cumulativeWorkMins = 0;
  let cumulativeWalkMins = 0;
  let totalCompletedDominos = 0;
  let totalPartASolved = 0;

  // Circadian Output Buckets (in minutes)
  const windowMins = {
    MORNING: { label: 'MORNING (05:00–11:59)', mins: 0 },
    AFTERNOON: { label: 'AFTERNOON (12:00–16:59)', mins: 0 },
    EVENING: { label: 'EVENING (17:00–20:59)', mins: 0 },
    NIGHT: { label: 'NIGHT (21:00–04:59)', mins: 0 }
  };

  for (const rawRec of Object.values(state.records || {})) {
    const rec = normalizeDayRecord(rawRec);
    totalPartASolved += rec.partACount || 0;

    for (const [blockId, rawMins] of Object.entries(rec.durations || {})) {
      const mins = Number(rawMins) || 0;
      const b = blockMap[blockId];
      const cat = b ? b.category : 'OTHER';
      if (cat === 'STUDY') cumulativeStudyMins += mins;
      else if (cat === 'WORK') cumulativeWorkMins += mins;
      else if (cat === 'WALK') cumulativeWalkMins += mins;
    }

    for (const cEntry of rec.customMins || []) {
      const mins = Number(cEntry.mins) || 0;
      if (cEntry.category === 'STUDY') cumulativeStudyMins += mins;
      else if (cEntry.category === 'WORK') cumulativeWorkMins += mins;
      else if (cEntry.category === 'WALK') cumulativeWalkMins += mins;
    }

    for (const compId of rec.completed || []) {
      if (isDominoTask(blockMap[compId])) totalCompletedDominos += 1;
    }

    for (const logItem of rec.logs || []) {
      if (!logItem.mins || logItem.mins <= 0) continue;
      const hr = parseHour24Fallback(logItem);
      if (hr >= 5 && hr < 12) windowMins.MORNING.mins += logItem.mins;
      else if (hr >= 12 && hr < 17) windowMins.AFTERNOON.mins += logItem.mins;
      else if (hr >= 17 && hr < 21) windowMins.EVENING.mins += logItem.mins;
      else windowMins.NIGHT.mins += logItem.mins;
    }
  }

  const totalLoggedWindowMins = Object.values(windowMins).reduce((s, w) => s + w.mins, 0);
  const peakWindows = Object.entries(windowMins).map(([key, data]) => {
    const pct = totalLoggedWindowMins > 0 ? Math.round((data.mins / totalLoggedWindowMins) * 100) : 0;
    return {
      key,
      label: data.label,
      hours: (data.mins / 60).toFixed(1),
      mins: data.mins,
      pct
    };
  });

  const topWindow = [...peakWindows].sort((a, b) => b.mins - a.mins)[0];
  const totalProductiveMins = cumulativeStudyMins + cumulativeWorkMins + cumulativeWalkMins;
  const level = Math.floor(totalCompletedDominos / 4) + 1;

  return {
    cumulativeStudyHours: (cumulativeStudyMins / 60).toFixed(1),
    cumulativeWorkHours: (cumulativeWorkMins / 60).toFixed(1),
    cumulativeWalkHours: (cumulativeWalkMins / 60).toFixed(1),
    totalProductiveHours: (totalProductiveMins / 60).toFixed(1),
    totalCompletedDominos,
    totalPartASolved,
    level,
    streak: state.streak || 0,
    bestStreak: state.bestStreak || 0,
    peakWindows,
    topWindowName: topWindow && topWindow.mins > 0 ? `${topWindow.key} (${topWindow.pct}%)` : 'NO DATA YET'
  };
}

// Theme Management (2 Themes: oled, cyber)
export function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'oled' || saved === 'cyber') return saved;
    if (saved === 'apple' || saved === 'brutalist' || saved === 'stealth') return 'oled';
  } catch {}
  return 'oled';
}

export function isOledMode() {
  return getTheme() === 'oled';
}

export function setOledMode(enabled) {
  const targetTheme = enabled ? 'oled' : 'cyber';
  return setTheme(targetTheme);
}

export function setTheme(themeId) {
  const match = THEMES.find(t => t.id === themeId);
  const valid = match ? match.id : 'oled';
  localStorage.setItem(THEME_KEY, valid);
  document.documentElement.setAttribute('data-theme', valid);
  THEMES.forEach(t => {
    document.documentElement.classList.remove(`theme-${t.id}`);
  });
  document.documentElement.classList.add(`theme-${valid}`);
  const state = getState();
  state.settings = state.settings || {};
  state.settings.theme = valid;
  saveState(state);
  document.dispatchEvent(new CustomEvent('theme-changed', { detail: valid }));
  playRelayClick();
  return valid;
}

export function cycleTheme() {
  const current = getTheme();
  const idx = THEMES.findIndex(t => t.id === current);
  const nextIdx = (idx + 1) % THEMES.length;
  return setTheme(THEMES[nextIdx].id);
}

// User-chosen OLED accent color (supports curated soft pastels)
export function getAccentColor() {
  try {
    const state = getState();
    if (state.settings && state.settings.accentColor) return state.settings.accentColor;
  } catch {}
  return '#C4B5FD';
}

export function setAccentColor(hex) {
  let cleanHex = hex || '#C4B5FD';
  if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
  document.documentElement.style.setProperty('--domino-accent', cleanHex);
  document.documentElement.style.setProperty('--accent', cleanHex);
  const state = getState();
  state.settings = state.settings || {};
  state.settings.accentColor = cleanHex;
  saveState(state);
  document.dispatchEvent(new CustomEvent('accent-changed', { detail: cleanHex }));
  return cleanHex;
}

export function getCardInfusionScope() {
  try {
    const state = getState();
    if (state.settings && state.settings.cardInfusion) return state.settings.cardInfusion;
  } catch {}
  return 'all';
}

export function setCardInfusionScope(scope) {
  const valid = scope === 'hero' ? 'hero' : 'all';
  const state = getState();
  state.settings = state.settings || {};
  state.settings.cardInfusion = valid;
  saveState(state);
  document.dispatchEvent(new CustomEvent('accent-changed', { detail: valid }));
  return valid;
}

// Helpers for backward-compatibility
export function updateSettings(newSettings) {
  const state = getState();
  state.settings = { ...(state.settings || {}), ...newSettings };
  saveState(state);
}

export function resetState() {
  _stateCache = {
    records: {},
    streak: 0,
    bestStreak: 0,
    shields: 2,
    settings: structuredClone(DEFAULT_SETTINGS)
  };
  saveState(_stateCache);
  localStorage.removeItem(BLOCKS_KEY);
  localStorage.removeItem(ALARMS_KEY);
  playRelayClick();
}

export function formatHours(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes)) return '0h';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDetailedHours(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes)) return '0h 00m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export function getAllCompletedTasksCount() {
  const telemetry = getCumulativeTelemetry();
  return telemetry.totalCompletedDominos;
}

export function getGrandTotalLoggedMinutes() {
  const telemetry = getCumulativeTelemetry();
  return Math.round(parseFloat(telemetry.totalProductiveHours) * 60);
}

export function getDominoDuration(dominoId, dateStr, defaultMinutes = 0) {
  const rec = getDayRecord(dateStr);
  if (rec.durations && rec.durations[dominoId] !== undefined) {
    return Number(rec.durations[dominoId]);
  }
  return 0;
}

export function setDominoDuration(dominoId, dateStr, minutes) {
  const rec = getDayRecord(dateStr);
  const cleanMins = Math.max(0, Math.round(Number(minutes)));
  rec.durations[dominoId] = cleanMins;
  const blocks = getBlocks();
  const block = blocks.find(b => b.id === dominoId);
  const effectiveTarget = rec.emergency ? Math.ceil((block?.targetMins || 60) / 2) : (block?.targetMins || 60);

  if (cleanMins >= effectiveTarget) {
    if (!rec.completed.includes(dominoId)) {
      rec.completed.push(dominoId);
    }
  } else {
    rec.completed = rec.completed.filter(id => id !== dominoId);
  }
  const state = getState();
  recalculateStreak(state);
  saveState(state);
  return cleanMins;
}

export function toggleDominoComplete(dominoId, dateStr) {
  const rec = getDayRecord(dateStr);
  const blocks = getBlocks();
  const block = blocks.find(b => b.id === dominoId);
  const effectiveTarget = rec.emergency ? Math.ceil((block?.targetMins || 60) / 2) : (block?.targetMins || 60);

  if (rec.completed.includes(dominoId)) {
    rec.completed = rec.completed.filter(id => id !== dominoId);
    rec.durations[dominoId] = 0;
  } else {
    rec.completed.push(dominoId);
    if (!rec.durations[dominoId] || rec.durations[dominoId] < effectiveTarget) {
      rec.durations[dominoId] = effectiveTarget;
    }
  }
  const state = getState();
  recalculateStreak(state);
  saveState(state);
  return rec.completed.includes(dominoId);
}
