/**
 * Streak Engine — streak calculation, shields, quality-weighted level system.
 */
import { getState, ensureDayRecord, saveState, getQualityScore, removeDominoRating } from './state.js';
import { getCoreDominoIds, getDominoById } from './dominos.js';
import { getTotalDays, getDateStrFromOffset, getCurrentDateStr } from '../utils/dates.js';

/** Check if a day record counts as "complete" */
export function isDayComplete(dayRecord) {
  if (!dayRecord) return false;
  if (dayRecord.shieldUsed) return true;
  const coreIds = getCoreDominoIds();
  return coreIds.every((id) => dayRecord.completed && dayRecord.completed[id]);
}

/** Calculate current streak (counting backwards from today) */
export function calculateStreak() {
  const state = getState();
  const currentDate = getCurrentDateStr();
  const totalDays = getTotalDays();
  let streak = 0;

  const allDates = [];
  for (let i = 0; i < totalDays; i++) {
    allDates.push(getDateStrFromOffset(i));
  }

  const upToIndex = allDates.indexOf(currentDate);
  if (upToIndex < 0) return 0;

  for (let i = upToIndex; i >= 0; i--) {
    const rec = state.days[allDates[i]];
    if (isDayComplete(rec)) {
      streak++;
    } else if (i === upToIndex) {
      // Today might not be done yet — skip
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** Toggle a domino completion for a given date */
export function toggleDomino(id, dateStr) {
  const day = ensureDayRecord(dateStr);
  const dom = getDominoById(id);
  if (!dom) return;

  if (day.completed[id]) {
    delete day.completed[id];
    removeDominoRating(id, dateStr);
  } else {
    day.completed[id] = true;
  }

  // Check if streak just hit a 7-day multiple → earn shield
  checkShieldEarning();
  saveState();
}

/** Toggle emergency mode for a date */
export function toggleEmergencyMode(dateStr) {
  const state = getState();
  const day = ensureDayRecord(dateStr);

  if (!day.emergency) {
    // Check golden rule: no two emergency days in a row
    const prevDate = new Date(dateStr + 'T00:00:00');
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = prevDate.toISOString().split('T')[0];
    if (state.days[prevStr] && state.days[prevStr].emergency) {
      return { success: false, message: 'Golden Rule: No two Emergency Days in a row! Push for the standard floor today.' };
    }
  }

  day.emergency = !day.emergency;
  saveState();
  return { success: true, emergency: day.emergency };
}

/** Use a streak shield on a date */
export function useStreakShield(dateStr) {
  const state = getState();
  const day = ensureDayRecord(dateStr);

  if (day.shieldUsed) {
    return { success: false, message: 'Shield already active on this date.' };
  }
  if (state.shields <= 0) {
    return { success: false, message: 'No shields left! Complete 7 full days to earn one.' };
  }

  state.shields--;
  day.shieldUsed = true;
  saveState();
  return { success: true, remaining: state.shields };
}

/** Check if the streak just hit a 7-day multiple and award a shield */
function checkShieldEarning() {
  const state = getState();
  const streak = calculateStreak();
  if (streak > 0 && streak % 7 === 0 && state.shields < 3) {
    state.shields++;
  }
}

/** Trigger wake-up for a date */
export function triggerWakeUp(dateStr) {
  const day = ensureDayRecord(dateStr);
  day.wakeTimestamp = Date.now();
  saveState();
}

/** Get current Quality-Weighted Level (Every 25 Quality Points = 1 Level) */
export function getLevel() {
  const quality = getQualityScore();
  return Math.floor(quality / 25) + 1;
}

/** Get Level progress (0 to 1) towards the next Level */
export function getLevelProgress() {
  const quality = getQualityScore();
  return (quality % 25) / 25;
}
