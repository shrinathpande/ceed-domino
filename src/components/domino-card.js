/**
 * Domino Card Component — individual domino block with timer launch and completion.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord } from '../core/state.js';
import { toggleDomino } from '../core/streak.js';
import { startTimer } from '../core/timer.js';
import { formatMins } from '../utils/format.js';
import { fireConfetti } from './confetti.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap, vibrateCompletion } from '../core/notifications.js';
import { showToast } from './header.js';

/** Color map for domino accent colors */
const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/20',
    badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-500/20',
    badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-500/20',
    badge: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300',
  },
};

/** Render a single domino card */
export function renderDominoCard(domino, dateStr, onTimerStart) {
  const day = ensureDayRecord(dateStr);
  const done = !!day.completed[domino.id];
  const mins = day.emergency ? domino.emergencyMins : domino.normalMins;
  const colors = COLOR_MAP[domino.color] || COLOR_MAP.blue;

  const card = document.createElement('article');
  card.className = `rounded-2xl border transition-all duration-300 ${
    done
      ? 'bg-green-50/60 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
      : `bg-white dark:bg-zinc-900 ${colors.border}`
  }`;
  card.setAttribute('data-domino-id', domino.id);
  card.setAttribute('data-state', done ? 'completed' : 'pending');

  card.innerHTML = `
    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <!-- Badge Row -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${colors.badge}">
              <span class="w-3 h-3">${icon(domino.icon)}</span>
              ${domino.badge}
            </span>
            <span class="text-[11px] font-mono text-gray-400 dark:text-zinc-500">${domino.offset}</span>
            <span class="inline-flex items-center gap-0.5 text-[11px] font-semibold ${colors.text}">
              <span class="w-3 h-3">${icon('timer')}</span>
              ${formatMins(mins)}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-[15px] font-semibold mt-1.5 ${
            done ? 'line-through text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
          }">${domino.title}</h3>

          <!-- Subtitle & Description -->
          ${domino.subtitle ? `<p class="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">${domino.subtitle}</p>` : ''}
          <p class="text-xs text-gray-400 dark:text-zinc-500 mt-1 leading-relaxed">${domino.desc}</p>
        </div>

        <!-- Completion Toggle -->
        <button
          class="check-btn w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg border-2 transition-all duration-200 shrink-0 touch-manipulation active:scale-90 ${
            done
              ? 'bg-green-500 border-green-400 text-white shadow-sm shadow-green-500/20'
              : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-300 dark:text-zinc-600 hover:border-green-300 dark:hover:border-green-500/40'
          }"
          aria-label="${done ? 'Mark as incomplete' : 'Mark as complete'}: ${domino.title}"
          aria-pressed="${done}"
        >
          <span class="w-5 h-5">${icon('check')}</span>
        </button>
      </div>

      <!-- Footer: XP + Timer Button -->
      <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <span class="text-[11px] font-semibold ${colors.text} tabular-nums">+${domino.xp} XP</span>
        <button
          class="timer-btn inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 transition-colors touch-manipulation active:scale-95"
          aria-label="Start ${formatMins(mins)} timer for ${domino.title}"
        >
          <span class="w-3.5 h-3.5">${icon('play')}</span>
          Start ${formatMins(mins)}
        </button>
      </div>
    </div>
  `;

  // Bind check button
  const checkBtn = card.querySelector('.check-btn');
  checkBtn.addEventListener('click', () => {
    const wasComplete = !!ensureDayRecord(dateStr).completed[domino.id];
    toggleDomino(domino.id, dateStr);

    if (!wasComplete) {
      // Just completed — celebrate!
      fireConfetti();
      playDing();
      vibrateTap();
    }
  });

  // Bind timer button
  const timerBtn = card.querySelector('.timer-btn');
  timerBtn.addEventListener('click', () => {
    if (onTimerStart) {
      onTimerStart(domino, mins);
    }
  });

  return card;
}
