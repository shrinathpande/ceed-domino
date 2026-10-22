/**
 * Date utilities for the CEED Domino Tracker.
 */
import { getState } from '../core/state.js';

/** Get the configured start date */
export function getStartDate() {
  const state = getState();
  return new Date(state.settings.startDate + 'T00:00:00');
}

/** Get the configured end date */
export function getEndDate() {
  const state = getState();
  return new Date(state.settings.endDate + 'T00:00:00');
}

/** Calculate total days between start and end (inclusive) */
export function getTotalDays() {
  const start = getStartDate();
  const end = getEndDate();
  return Math.round((end - start) / 86400000) + 1;
}

/** Get date string (YYYY-MM-DD) from day offset index */
export function getDateStrFromOffset(dayIndex) {
  const start = getStartDate();
  const d = new Date(start);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().split('T')[0];
}

/** Get current date string clamped to start/end range */
export function getCurrentDateStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const formatted = `${yyyy}-${mm}-${dd}`;

  const state = getState();
  if (formatted < state.settings.startDate) return state.settings.startDate;
  if (formatted > state.settings.endDate) return state.settings.endDate;
  return formatted;
}

/** Get day index (0-based) for a given date string */
export function getDayIndex(dateStr) {
  const start = getStartDate();
  const target = new Date(dateStr + 'T00:00:00');
  return Math.max(0, Math.min(getTotalDays() - 1, Math.round((target - start) / 86400000)));
}

/** Get phase label based on day index */
export function getPhaseLabel(dayIndex) {
  const totalDays = getTotalDays();
  const phase1End = Math.floor(totalDays * 0.34);
  const phase2End = Math.floor(totalDays * 0.75);

  if (dayIndex < phase1End) return 'Phase 1: Endurance & Accuracy';
  if (dayIndex < phase2End) return 'Phase 2: Speed & Storytelling';
  return 'Phase 3: Exam-Clock Lock-In';
}

/** Get days remaining until end date */
export function getDaysRemaining() {
  const now = new Date();
  const end = getEndDate();
  const diff = Math.ceil((end - now) / 86400000);
  return Math.max(0, diff);
}

/** Get wake offset string from a wake timestamp */
export function getWakeOffset(wakeTimestamp) {
  if (!wakeTimestamp) return 'Wake + 00:00';
  const diffMins = Math.floor((Date.now() - wakeTimestamp) / 60000);
  const hrs = String(Math.floor(diffMins / 60)).padStart(2, '0');
  const mins = String(diffMins % 60).padStart(2, '0');
  return `Wake + ${hrs}:${mins}`;
}
