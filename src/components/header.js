/**
 * Header Component — Industrial Brutalist Instrument Header.
 * Precision ledger metrics: Day count, streak count, shields, XP ledger, and relative wake offset.
 */
import { getState, ensureDayRecord, getAverageHonestyRating, getAllCompletedTasksCount } from '../core/state.js';
import { icon } from '../icons/index.js';
import { getDayIndex, getPhaseLabel, getDaysRemaining, getWakeOffset } from '../utils/dates.js';
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
  const avgHonesty = getAverageHonestyRating();
  const totalTasks = getAllCompletedTasksCount();
  const wakeOffset = getWakeOffset(day.wakeTimestamp);
  const isAwake = !!day.wakeTimestamp;

  container.innerHTML = `
    <header class="sticky top-0 z-30 bg-[var(--surface)] ledger-rule-b px-4 py-3" role="banner">
      <div class="max-w-xl mx-auto">
        <!-- Top Status Bar: System Mark + Stage + Instrumentation Counters -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <!-- Brutalist Monogram Stamp -->
            <div class="w-6 h-6 bg-[var(--accent)] text-[var(--surface)] font-mono text-xs font-bold flex items-center justify-center rounded-[2px]" aria-hidden="true">
              C87
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[12px] font-mono font-bold text-[var(--text)]">
                  DAY ${dayIndex + 1} of 87
                </span>
                <span class="text-[11px] text-[var(--muted)] border-l border-[var(--border)] pl-1.5 font-medium">
                  ${phase}
                </span>
              </div>
            </div>
          </div>

          <!-- Shield & Streak Indicators -->
          <div class="flex items-center gap-1.5 font-mono">
            <!-- Shield Trigger -->
            <button
              id="shieldBtn"
              class="flex items-center gap-1 px-2 py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold hover:border-[var(--control)] transition-colors active:scale-95"
              aria-label="Use streak shield. ${state.shields} remaining"
              title="Use streak shield to preserve momentum"
            >
              <span class="w-3.5 h-3.5 text-[var(--muted)]">${icon('shield')}</span>
              <span class="tabular-nums">${state.shields}</span>
            </button>

            <!-- Streak Counter -->
            <div class="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[var(--text)] text-[var(--surface)] text-xs font-bold" aria-label="Current streak: ${streak} days">
              <span class="w-3.5 h-3.5">${icon('fire')}</span>
              <span class="tabular-nums">${streak}D</span>
            </div>
          </div>
        </div>

        <!-- Metric Ledger Row: Level, Quality progress, Be Honest Average, and Wake Offset Engine -->
        <div class="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--rule)] text-xs font-mono">
          <div class="flex items-center gap-2.5">
            <span class="text-[var(--text)] font-semibold flex items-center gap-1">
              <span class="w-3 h-3 text-[var(--chart-accent)]">${icon('bolt')}</span>
              <span>LVL ${level}</span>
            </span>

            <!-- Quality Progress Rail -->
            <div class="w-12 h-1.5 bg-[var(--border)] rounded-[1px] overflow-hidden" role="progressbar" aria-valuenow="${Math.round(levelProgress * 100)}" aria-valuemin="0" aria-valuemax="100" title="Progress to Level ${level + 1}">
              <div class="h-full bg-[var(--chart-accent)]" style="width: ${levelProgress * 100}%"></div>
            </div>

            <!-- Be Honest Average Metric -->
            <span class="text-[var(--text)] font-bold flex items-center gap-1 text-[11px] bg-[var(--raised)] px-1.5 py-0.5 rounded-[2px] border border-[var(--border)]">
              <span class="text-[var(--chart-accent)]">★</span>
              <span>${avgHonesty.toFixed(1)}/5.0</span>
              <span class="text-[9px] uppercase tracking-wider text-[var(--muted)]">HONEST</span>
            </span>

            <span class="text-[var(--muted)] tabular-nums hidden sm:inline">
              ${daysLeft}d left
            </span>
          </div>

          <!-- Wake Offset Engine -->
          <div class="flex items-center gap-1.5">
            <span id="wakeClock" class="text-[11px] font-mono text-[var(--text)] bg-[var(--raised)] border border-[var(--border)] px-1.5 py-0.5 rounded-[2px] tabular-nums" aria-live="polite">
              ${isAwake ? wakeOffset : 'Wake + 00:00'}
            </span>
            ${!isAwake ? `
              <button
                id="wakeBtn"
                class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)] hover:opacity-90 active:scale-95 transition-opacity"
                aria-label="Initialize day start at Wake 0:00"
              >
                START
              </button>
            ` : ''}
          </div>
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
