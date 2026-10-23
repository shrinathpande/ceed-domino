/**
 * Telemetry Engine — Strava-Style Athletic Focus Metrics & Performance Ledger.
 * Computes Personal Records (PRs), Per-Domino Splits, Rolling Pacing, and GitHub Matrix Intensities.
 */
import { getState, getGrandTotalLoggedMinutes, getAllCompletedTasksCount, formatHours, formatDetailedHours } from './state.js';
import { getDominos, isDominoTask } from './dominos.js';
import { isDayComplete, calculateStreak } from './streak.js';
import { getTotalDays, getDateStrFromOffset, getCurrentDateStr, getDaysRemaining } from '../utils/dates.js';

/**
 * Get total focus minutes logged for a specific date (MANDATORY DOMINO TASKS ONLY)
 */
export function getDayFocusMinutes(dateStr) {
  const state = getState();
  const day = state.days[dateStr];
  if (!day) return 0;

  const dominos = getDominos();
  const mandatoryDominos = dominos.filter((d) => isDominoTask(d));
  let totalMins = 0;

  for (const dom of mandatoryDominos) {
    if (day.durations && day.durations[dom.id] !== undefined) {
      totalMins += Number(day.durations[dom.id]);
    } else if (day.completed && day.completed[dom.id]) {
      totalMins += day.emergency ? dom.emergencyMins : dom.normalMins;
    }
  }

  return totalMins;
}

/**
 * Determine GitHub intensity level (0 to 4) for a specific date:
 * Level 0: 0 mins (no focus)
 * Level 1: Under floor (< 4h = < 240 mins)
 * Level 2: Standard floor (4h to < 6h = 240 to 359 mins)
 * Level 3: Over-delivered (6h to < 8h = 360 to 479 mins)
 * Level 4: Studio beast mode (8h+ = 480+ mins)
 */
export function getGitHubIntensityLevel(dateStr) {
  const mins = getDayFocusMinutes(dateStr);
  if (mins <= 0) return 0;
  if (mins < 240) return 1;
  if (mins < 360) return 2;
  if (mins < 480) return 3;
  return 4;
}

/**
 * Calculate the all-time longest streak in days
 */
export function calculateLongestStreak() {
  const state = getState();
  const totalDays = getTotalDays();
  let maxStreak = 0;
  let currentRun = 0;

  for (let i = 0; i < totalDays; i++) {
    const dateStr = getDateStrFromOffset(i);
    const rec = state.days[dateStr];
    if (isDayComplete(rec)) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else {
      currentRun = 0;
    }
  }

  return maxStreak;
}

/**
 * Calculate comprehensive telemetry metrics
 */
export function getTelemetryStats() {
  const state = getState();
  const dominos = getDominos();
  const mandatoryDominos = dominos.filter((d) => isDominoTask(d));
  const totalDays = getTotalDays();
  const currentDateStr = getCurrentDateStr();
  const daysRemaining = getDaysRemaining();

  const grandTotalMins = getGrandTotalLoggedMinutes();
  const totalCompletedDominos = getAllCompletedTasksCount();
  const currentStreak = calculateStreak();
  const longestStreak = calculateLongestStreak();

  // 1. Day-by-Day Analysis & PR extraction
  let longestDay = { minutes: 0, hours: 0, dateStr: null, dominosCount: 0 };
  let activeDaysCount = 0;
  let totalPartBQuestions = 0;
  let standardFloorDays = 0;
  let emergencyDays = 0;
  let shieldDays = 0;
  let underFloorDays = 0;

  // Track weekly volume
  const weeklyHours = {};

  for (let i = 0; i < totalDays; i++) {
    const dateStr = getDateStrFromOffset(i);
    const day = state.days[dateStr];
    const mins = getDayFocusMinutes(dateStr);

    if (mins > 0 || (day && Object.keys(day.completed || {}).length > 0)) {
      activeDaysCount++;
    }

    if (mins > longestDay.minutes) {
      const completedCount = day && day.completed
        ? Object.keys(day.completed).filter((id) => mandatoryDominos.some((m) => m.id === id)).length
        : 0;
      longestDay = {
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        dateStr,
        dominosCount: completedCount,
      };
    }

    if (day) {
      if (day.shieldUsed) {
        shieldDays++;
      } else if (day.emergency && isDayComplete(day)) {
        emergencyDays++;
      } else if (isDayComplete(day)) {
        standardFloorDays++;
      }

      // Check if any domino was completed under standard floor
      let hasUnder = false;
      for (const dom of mandatoryDominos) {
        if (day.completed && day.completed[dom.id]) {
          const logged = day.durations && day.durations[dom.id] !== undefined
            ? Number(day.durations[dom.id])
            : dom.normalMins;
          if (logged < dom.normalMins) {
            hasUnder = true;
          }
        }
      }
      if (hasUnder) underFloorDays++;

      // Count Part B Questions from exam logs
      if (day.examLog && day.examLog.answers) {
        totalPartBQuestions += Object.keys(day.examLog.answers).length;
      } else if (day.completed && day.completed['d3']) {
        totalPartBQuestions += 5; // Default standard CEED Part B set = 5 questions
      }
    }

    // Weekly bucket (week 0 to 12)
    const weekIdx = Math.floor(i / 7);
    weeklyHours[weekIdx] = (weeklyHours[weekIdx] || 0) + mins;
  }

  // Find Peak Week
  let peakWeek = { weekIndex: 0, hours: 0 };
  for (const [wIdx, wMins] of Object.entries(weeklyHours)) {
    const wHours = Number((wMins / 60).toFixed(1));
    if (wHours > peakWeek.hours) {
      peakWeek = { weekIndex: Number(wIdx) + 1, hours: wHours };
    }
  }

  // 2. Per-Domino Athletic Splits
  const dominoSplits = mandatoryDominos.map((dom) => {
    let domTotalMins = 0;
    let completedCount = 0;
    let maxSessionMins = 0;

    for (const date in state.days) {
      const day = state.days[date];
      if (!day) continue;

      if (day.durations && day.durations[dom.id] !== undefined) {
        const dMins = Number(day.durations[dom.id]);
        domTotalMins += dMins;
        if (dMins > maxSessionMins) maxSessionMins = dMins;
      } else if (day.completed && day.completed[dom.id]) {
        const floor = day.emergency ? dom.emergencyMins : dom.normalMins;
        domTotalMins += floor;
        if (floor > maxSessionMins) maxSessionMins = floor;
      }

      if (day.completed && day.completed[dom.id]) {
        completedCount++;
      }
    }

    const avgMins = completedCount > 0 ? Math.round(domTotalMins / completedCount) : 0;
    const completionRate = activeDaysCount > 0 ? Math.round((completedCount / activeDaysCount) * 100) : 0;

    // Extra Strava metrics:
    // D1: Estimated Aerobic Distance at 5.5 km/h
    const estimatedDistanceKm = dom.id === 'd1' ? ((domTotalMins / 60) * 5.5).toFixed(1) : null;
    // D3: Questions Solved
    const questionsSolved = dom.id === 'd3' ? totalPartBQuestions : null;

    return {
      id: dom.id,
      title: dom.title,
      badge: dom.badge,
      totalMinutes: domTotalMins,
      totalHours: (domTotalMins / 60).toFixed(1),
      completedCount,
      completionRate,
      averageMinutes: avgMins,
      maxSessionMinutes: maxSessionMins,
      estimatedDistanceKm,
      questionsSolved,
    };
  });

  // 3. Rolling 7-Day Velocity & Pacing Forecast
  let rolling7DayMins = 0;
  const todayIdx = Math.max(0, Math.min(totalDays - 1, totalDays - daysRemaining));
  const rollingStartIdx = Math.max(0, todayIdx - 6);
  for (let i = rollingStartIdx; i <= todayIdx; i++) {
    rolling7DayMins += getDayFocusMinutes(getDateStrFromOffset(i));
  }
  const rollingDailyHours = Number(((rolling7DayMins / 7) / 60).toFixed(2));
  const currentTotalHours = Number((grandTotalMins / 60).toFixed(1));
  const projectedTotalHours = (currentTotalHours + rollingDailyHours * daysRemaining).toFixed(0);
  const hoursNeededFor500 = daysRemaining > 0
    ? Math.max(0, (500 - currentTotalHours) / daysRemaining).toFixed(1)
    : '0.0';

  const dailyAverageHours = activeDaysCount > 0
    ? (currentTotalHours / activeDaysCount).toFixed(1)
    : '0.0';

  return {
    totalHours: currentTotalHours,
    grandTotalMinutes: grandTotalMins,
    totalCompletedDominos,
    activeDaysCount,
    dailyAverageHours,
    currentStreak,
    longestStreak,
    personalRecords: {
      longestDay,
      longestStreak,
      peakWeek,
      totalPartBQuestions,
    },
    dominoSplits,
    pacing: {
      daysRemaining,
      rollingDailyHours,
      rolling7DayHours: (rolling7DayMins / 60).toFixed(1),
      projectedTotalHours,
      hoursNeededFor500,
    },
    adherence: {
      standardFloorDays,
      emergencyDays,
      shieldDays,
      underFloorDays,
      totalTrackedDays: activeDaysCount,
    },
  };
}

/**
 * Export daily telemetry and per-domino focus breakdown as a downloadable CSV spreadsheet
 */
export function exportTelemetryCSV() {
  const state = getState();
  const totalDays = getTotalDays();
  const dominos = getDominos();
  const mandatoryDominos = dominos.filter((d) => isDominoTask(d));

  const headers = [
    'Day_Index',
    'Date',
    'Total_Focus_Hours',
    'Total_Focus_Minutes',
    'Daily_Status',
    'Emergency_Mode',
    'Shield_Applied',
    ...mandatoryDominos.map((d) => `${d.badge.replace(/\s+/g, '_')}_${d.title.replace(/[^a-zA-Z0-9]/g, '_')}_Mins`),
  ];
  const rows = [headers.join(',')];

  for (let i = 0; i < totalDays; i++) {
    const dateStr = getDateStrFromOffset(i);
    const day = state.days[dateStr];
    const mins = getDayFocusMinutes(dateStr);
    const hours = (mins / 60).toFixed(2);
    const complete = isDayComplete(day);
    const emergency = day?.emergency ? 'YES' : 'NO';
    const shield = day?.shieldUsed ? 'YES' : 'NO';
    const status = complete
      ? day?.emergency
        ? 'BAD_DAY_FLOOR'
        : 'STANDARD_FLOOR'
      : mins > 0
      ? 'PARTIAL'
      : 'NO_LOG';

    const domColValues = mandatoryDominos.map((dom) => {
      if (!day) return 0;
      if (day.durations && day.durations[dom.id] !== undefined) return day.durations[dom.id];
      if (day.completed && day.completed[dom.id]) return day.emergency ? dom.emergencyMins : dom.normalMins;
      return 0;
    });

    rows.push([i + 1, dateStr, hours, mins, status, emergency, shield, ...domColValues].join(','));
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ceed-domino-telemetry-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export complete structured telemetry report and full state backup as downloadable JSON
 */
export function exportTelemetryJSON() {
  const stats = getTelemetryStats();
  const state = getState();
  const report = {
    appName: 'CEED 87-Day Domino Tracker',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    telemetry: stats,
    rawState: state,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ceed-telemetry-report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
