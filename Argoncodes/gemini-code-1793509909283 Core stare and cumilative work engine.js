// src/core/state.js
import { playRelayClick } from '../utils/sound.js';

const STATE_KEY = 'ceed_v2_state';
const BLOCKS_KEY = 'ceed_v2_blocks';

export const DEFAULT_BLOCKS = [
  { id: 'd1', badge: 'DOMINO 1', name: 'Walk & Fitness', category: 'WALK', targetMins: 90 },
  { id: 'd2', badge: 'DOMINO 2', name: 'Study & Sketching', category: 'STUDY', targetMins: 120 },
  { id: 'd3', badge: 'DOMINO 3', name: 'Paperwork & CEED Sprint', category: 'STUDY', targetMins: 180 },
  { id: 'd4', badge: 'DOMINO 4', name: 'Work & Studio Output', category: 'WORK', targetMins: 240 }
];

// Core architectural invariant: any block with 'DOMINO' in badge is mandatory
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
      durations: {},   // { d1: 90, d2: 120, ... }
      completed: [],   // ['d1', 'd2']
      logs: [],        // [{ id, time: '10:05 AM', blockId, category, mins, label }]
      studioDone: [],  // ['d11_q1', 'd11_q2']
      emergency: false
    };
    saveState(state);
  }
  return state.records[dateStr];
}

// Time-independent logger with automatic Domino checkoff
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

  // Record timestamped log entry regardless of time of day
  if (deltaMins !== 0) {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    rec.logs.unshift({
      id: 'log_' + Date.now(),
      time: nowTime,
      blockId,
      category: block.category,
      mins: deltaMins,
      label: customLabel || block.name
    });
  }

  // Auto-complete Domino when target floor is met
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

export function recalculateStreak(state) {
  const blocks = getBlocks();
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);
  if (mandatoryIds.length === 0) return;

  const dates = Object.keys(state.records).sort();
  let currentStreak = 0;

  for (const d of dates) {
    const rec = state.records[d];
    const allDone = mandatoryIds.every(id => rec.completed.includes(id));
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

// Cumulative Study Hours, Work Hours & Total Productive Telemetry
export function getCumulativeTelemetry() {
  const state = getState();
  const blocks = getBlocks();
  const blockMap = Object.fromEntries(blocks.map(b => [b.id, b]));

  let cumulativeStudyMins = 0;
  let cumulativeWorkMins = 0;
  let cumulativeWalkMins = 0;
  let totalCompletedDominos = 0;

  for (const rec of Object.values(state.records)) {
    for (const [blockId, mins] of Object.entries(rec.durations || {})) {
      const b = blockMap[blockId];
      const cat = b ? b.category : 'OTHER';
      if (cat === 'STUDY') cumulativeStudyMins += mins;
      else if (cat === 'WORK') cumulativeWorkMins += mins;
      else if (cat === 'WALK') cumulativeWalkMins += mins;
    }
    for (const compId of rec.completed || []) {
      if (isDominoTask(blockMap[compId])) totalCompletedDominos += 1;
    }
  }

  const totalProductiveMins = cumulativeStudyMins + cumulativeWorkMins + cumulativeWalkMins;
  const level = Math.floor(totalCompletedDominos / 4) + 1;

  return {
    cumulativeStudyHours: (cumulativeStudyMins / 60).toFixed(1),
    cumulativeWorkHours: (cumulativeWorkMins / 60).toFixed(1),
    cumulativeWalkHours: (cumulativeWalkMins / 60).toFixed(1),
    totalProductiveHours: (totalProductiveMins / 60).toFixed(1),
    totalCompletedDominos,
    level,
    streak: state.streak || 0,
    bestStreak: state.bestStreak || 0
  };
}