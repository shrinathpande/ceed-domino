/**
 * Header Component — Industrial Brutalist Instrument Header.
 * Precision ledger metrics: Day count, streak count, shields, XP ledger, and relative wake offset.
 */
import { getState, ensureDayRecord, getAllCompletedTasksCount, getGrandTotalLoggedMinutes, formatHours } from '../core/state.js';
import { icon } from '../icons/index.js';
import { getDayIndex, getPhaseLabel, getDaysRemaining, getWakeOffset, getExamCountdown } from '../utils/dates.js';
import { calculateStreak, getLevel, getLevelProgress, triggerWakeUp, useStreakShield } from '../core/streak.js';

export function renderHeader(container, currentDateStr) {
  const state = getState();
  const day = ensureDayRecord(currentDateStr);
  const dayIndex = getDayIndex(currentDateStr);
  const phase = getPhaseLabel(dayIndex);
  const streak = calculateStreak();
  const daysLeft = getDaysRemaining();
  const level = getLevel();
  const levelProgress = getLevelProgress();
  const totalTasks = getAllCompletedTasksCount();
  const grandTotalMins = getGrandTotalLoggedMinutes();
  const wakeOffset = getWakeOffset(day.wakeTimestamp);
  const isAwake = !!day.wakeTimestamp;
  const examCountdown = getExamCountdown();

  container.innerHTML = `
    <header class="sticky top-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md ledger-rule-b px-3 py-2 font-mono transition-colors" role="banner">
      <div class="max-w-xl mx-auto flex items-center justify-between gap-1.5">
        <!-- Left: System Stamp & Day & Level & Countdown Pill -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="w-5 h-5 bg-[var(--accent)] text-[var(--surface)] text-[10px] font-bold flex items-center justify-center rounded-[2px]" aria-hidden="true">
            C87
          </div>
          <span class="text-[11px] font-bold text-[var(--text)]" title="Day ${dayIndex + 1} of 87">
            D${dayIndex + 1}
          </span>
          <span class="text-[10px] text-[var(--muted)] font-semibold bg-[var(--raised)] px-1 py-0.2 rounded-[1px]" title="Level ${level}">
            L${level}
          </span>
          <button
            id="examCountdownBtn"
            class="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--text)] bg-[var(--raised)] border border-[var(--border)] hover:border-[var(--control)] px-1.5 py-0.5 rounded-[2px] transition-colors touch-manipulation active:scale-95"
            title="${examCountdown.detailed} (Tap for details)"
            aria-label="${examCountdown.detailed}"
          >
            <span class="w-3 h-3 text-[var(--muted)]">${icon('timer')}</span>
            <span class="tabular-nums">${examCountdown.compact}</span>
          </button>
        </div>

        <!-- Center: Wake Clock -->
        <div class="flex items-center gap-1">
          <span id="wakeClock" class="text-[10px] font-mono font-bold text-[var(--text)] bg-[var(--raised)] border border-[var(--border)] px-1.5 py-0.5 rounded-[2px] tabular-nums" aria-live="polite">
            ${isAwake ? wakeOffset.replace('Wake + ', '+') : '+00:00'}
          </span>
          ${!isAwake ? `
            <button
              id="wakeBtn"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)] hover:opacity-90 active:scale-95 transition-opacity"
              aria-label="Initialize day start at Wake 0:00"
            >
              START
            </button>
          ` : ''}
        </div>

        <!-- Right: Shield, Streak, Sigma Hours Link -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            id="shieldBtn"
            class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] text-[10px] font-bold hover:border-[var(--control)] transition-colors active:scale-95"
            aria-label="Use streak shield. ${state.shields} remaining"
            title="Use streak shield to preserve momentum"
          >
            <span class="w-3 h-3 text-[var(--muted)]">${icon('shield')}</span>
            <span class="tabular-nums">${state.shields}</span>
          </button>

          <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)] text-[10px] font-bold" aria-label="Current streak: ${streak} days">
            <span class="w-3 h-3">${icon('fire')}</span>
            <span class="tabular-nums">${streak}D</span>
          </div>

          <a href="#/stats" class="text-[var(--text)] font-bold flex items-center gap-0.5 text-[10px] bg-[var(--raised)] hover:bg-[var(--surface)] px-1.5 py-0.5 rounded-[2px] border border-[var(--border)] transition-colors" title="Tap to open Stats">
            <span class="text-[var(--chart-accent)] font-bold">Σ</span>
            <span class="tabular-nums">${formatHours(grandTotalMins)}</span>
          </a>
        </div>
      </div>
    </header>
  `;

  const shieldBtn = container.querySelector('#shieldBtn');
  if (shieldBtn) {
    shieldBtn.addEventListener('click', () => {
      const result = useStreakShield(currentDateStr);
      if (!result.success) {
        showToast(result.message, 'warning');
      } else {
        showToast(`Shield activated. ${result.remaining} remaining.`, 'success');
      }
    });
  }

  const wakeBtn = container.querySelector('#wakeBtn');
  if (wakeBtn) {
    wakeBtn.addEventListener('click', () => {
      triggerWakeUp(currentDateStr);
    });
  }

  const countdownBtn = container.querySelector('#examCountdownBtn');
  if (countdownBtn) {
    countdownBtn.addEventListener('click', () => {
      const live = getExamCountdown();
      showToast(`⏳ ${live.detailed}`, 'info');
    });
  }
}

/** Crisp toast alert */
export function showToast(message, type = 'info') {
  const existing = document.querySelector('.ceed-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ceed-toast fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-[2px] bg-[var(--text)] text-[var(--surface)] text-xs font-mono font-semibold border border-[var(--border)] transition-opacity duration-150';
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 150);
  }, 2200);
}
