/**
 * Sticky Header Component — day badge, countdown, streak, shields, XP, wake clock.
 */
import { getState, ensureDayRecord } from '../core/state.js';
import { icon } from '../icons/index.js';
import { getDayIndex, getPhaseLabel, getDaysRemaining, getWakeOffset, getCurrentDateStr } from '../utils/dates.js';
import { calculateStreak, getLevel, getLevelProgress, triggerWakeUp, useStreakShield } from '../core/streak.js';

/** Render the header into the given container */
export function renderHeader(container, currentDateStr) {
  const state = getState();
  const day = ensureDayRecord(currentDateStr);
  const dayIndex = getDayIndex(currentDateStr);
  const phase = getPhaseLabel(dayIndex);
  const streak = calculateStreak();
  const daysLeft = getDaysRemaining();
  const level = getLevel();
  const levelProgress = getLevelProgress();
  const wakeOffset = getWakeOffset(day.wakeTimestamp);
  const isAwake = !!day.wakeTimestamp;

  container.innerHTML = `
    <header class="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-zinc-800/60 px-4 py-3 transition-colors" role="banner">
      <div class="max-w-lg mx-auto">
        <!-- Top Row: Day Badge + Streak/Shields -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 tabular-nums" id="dayBadge">
              Day ${dayIndex + 1}
            </span>
            <span class="text-[11px] font-medium text-gray-400 dark:text-zinc-500">${phase}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Shield Button -->
            <button
              id="shieldBtn"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold touch-manipulation transition-transform active:scale-95"
              aria-label="Use streak shield. ${state.shields} remaining"
              title="Tap to use a Streak Shield"
            >
              <span class="w-3.5 h-3.5">${icon('shield')}</span>
              <span class="tabular-nums" id="shieldCount">${state.shields}</span>
            </button>

            <!-- Streak Badge -->
            <div class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-extrabold" aria-label="Current streak: ${streak} days">
              <span class="w-4 h-4">${icon('fire')}</span>
              <span class="tabular-nums" id="streakCount">${streak}</span>
            </div>
          </div>
        </div>

        <!-- Second Row: XP + Countdown + Wake Clock -->
        <div class="flex items-center justify-between mt-2.5">
          <div class="flex items-center gap-3">
            <!-- XP -->
            <span class="flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400" id="xpDisplay" aria-label="Experience points: ${state.xp}, Level ${level}">
              <span class="w-3 h-3">${icon('bolt')}</span>
              <span class="tabular-nums">${state.xp.toLocaleString()} XP</span>
              <span class="text-gray-400 dark:text-zinc-500">Lvl ${level}</span>
            </span>

            <!-- XP Progress Bar -->
            <div class="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden" role="progressbar" aria-valuenow="${Math.round(levelProgress * 100)}" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full rounded-full bg-green-500 transition-all duration-500" style="width: ${levelProgress * 100}%"></div>
            </div>

            <!-- Exam Countdown -->
            <span class="text-[11px] font-medium text-gray-400 dark:text-zinc-500 tabular-nums" aria-label="${daysLeft} days until exam">
              ${daysLeft}d left
            </span>
          </div>

          <!-- Wake Clock -->
          <div class="flex items-center gap-1.5">
            <span id="wakeClock" class="text-[11px] font-mono font-medium text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md tabular-nums" aria-live="polite">
              ${isAwake ? wakeOffset : 'Wake + 00:00'}
            </span>
            ${!isAwake ? `
              <button
                id="wakeBtn"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md bg-green-500 text-white touch-manipulation transition-transform active:scale-95 hover:bg-green-600"
                aria-label="Start your day timer"
              >
                Start Day
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </header>
  `;

  // Bind events
  const shieldBtn = container.querySelector('#shieldBtn');
  if (shieldBtn) {
    shieldBtn.addEventListener('click', () => {
      const result = useStreakShield(currentDateStr);
      if (!result.success) {
        showToast(result.message, 'warning');
      } else {
        showToast(`Shield activated! ${result.remaining} remaining.`, 'success');
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

/** Simple toast notification */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.ceed-toast');
  if (existing) existing.remove();

  const colors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const toast = document.createElement('div');
  toast.className = `ceed-toast fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl ${colors[type]} text-white text-sm font-medium shadow-lg transition-all duration-300`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export { showToast };
