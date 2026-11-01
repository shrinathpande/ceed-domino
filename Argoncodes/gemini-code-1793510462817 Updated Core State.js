// src/core/state.js
import { playRelayClick } from '../utils/sound.js';

const STATE_KEY = 'ceed_v2_state';
const BLOCKS_KEY = 'ceed_v2_blocks';

export const DEFAULT_BLOCKS = [
  { id: 'd1', badge: 'DOMINO 1', name: 'Walk & Fitness', category: 'WALK', targetMins: 90 },
  { id: 'd2', badge: 'DOMINO 2', name: 'Study & Sketching', category: 'STUDY', targetMins: 120 },
  { id: 'd3', badge: 'DOMINO 3', name: 'Paperwork & CEED Sprint', category: 'STUDY', targetMins: 180, hasPartACounter: true },
  { id: 'd4', badge: 'DOMINO 4', name: 'Work & Studio Output', category: 'WORK', targetMins: 240 }
];

export function isDominoTask(block) {
  if (!block || !block.badge) return false;
  return block.badge.toUpperCase().includes('DOMINO');
}

export function getBlocks() {
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_BLOCKS);
  } catch {
    return structuredClone(DEFAULT_BLOCKS);
  }
}

export function saveBlocks(blocks) {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
}

export function getState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : { records: {}, streak: 0, bestStreak: 0, shields: 2 };
  } catch {
    return { records: {}, streak: 0, bestStreak: 0, shields: 2 };
  }
}

export function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function getDayRecord(dateStr) {
  const state = getState();
  if (!state.records[dateStr]) {
    state.records[dateStr] = {
      durations: {},
      completed: [],
      logs: [],
      customMins: [],
      partACount: 0,
      partABonusClaimed: false,
      emergency: false
    };
    saveState(state);
  }
  return state.records[dateStr];
}

export function logHours(dateStr, blockId, deltaMins, customLabel = null) {
  const state = getState();
  const blocks = getBlocks();
  const block = blocks.find(b => b.id === blockId);
  if (!block) return;

  if (!state.records[dateStr]) getDayRecord(dateStr);
  const rec = state.records[dateStr];

  const prev = rec.durations[blockId] || 0;
  const next = Math.max(0, prev + deltaMins);
  rec.durations[blockId] = next;

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

  const effectiveTarget = rec.emergency ? Math.ceil(block.targetMins / 2) : block.targetMins;
  if (next >= effectiveTarget && !rec.completed.includes(blockId)) {
    rec.completed.push(blockId);
  } else if (next === 0) {
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
  if (!state.records[dateStr]) getDayRecord(dateStr);
  const rec = state.records[dateStr];

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

  for (const d of dates) {
    const rec = state.records[d];
    const allDone = mandatoryIds.every(id => (rec.completed || []).includes(id));
    if (allDone || rec.shieldUsed) {
      currentStreak += 1;
    } else if (d !== new Date().toISOString().slice(0, 10)) {
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

  for (const rec of Object.values(state.records)) {
    totalPartASolved += rec.partACount || 0;

    for (const [blockId, mins] of Object.entries(rec.durations || {})) {
      const b = blockMap[blockId];
      const cat = b ? b.category : 'OTHER';
      if (cat === 'STUDY') cumulativeStudyMins += mins;
      else if (cat === 'WORK') cumulativeWorkMins += mins;
      else if (cat === 'WALK') cumulativeWalkMins += mins;
    }

    for (const cEntry of rec.customMins || []) {
      if (cEntry.category === 'STUDY') cumulativeStudyMins += cEntry.mins;
      else if (cEntry.category === 'WORK') cumulativeWorkMins += cEntry.mins;
      else if (cEntry.category === 'WALK') cumulativeWalkMins += cEntry.mins;
    }

    for (const compId of rec.completed || []) {
      if (isDominoTask(blockMap[compId])) totalCompletedDominos += 1;
    }

    // Aggregate timestamped logs into biological time-of-day windows
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