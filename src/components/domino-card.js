/**
 * Domino Card Component — Industrial Brutalist Task Unit.
 * High-legibility typography, crisp border tokens, exact time budgets, and tactile feedback.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord, getDominoDuration, getCumulativeDominoMinutes, formatHours, formatDetailedHours } from '../core/state.js';
import { toggleDomino } from '../core/streak.js';
import { formatMins } from '../utils/format.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap } from '../core/notifications.js';
import { showDurationModal } from './duration-modal.js';

export function renderDominoCard(domino, dateStr, onTimerStart, onOpenStudio) {
  const day = ensureDayRecord(dateStr);
  const done = !!day.completed[domino.id];
  const mins = day.emergency ? domino.emergencyMins : domino.normalMins;
  const loggedMins = getDominoDuration(domino.id, dateStr, mins);
  const cumulativeMins = getCumulativeDominoMinutes(domino.id);
  const isUnderFloor = done && loggedMins < mins;
  const isOverFloor = done && loggedMins > mins;
  const isPaperDomino = domino.id === 'd3';

  const card = document.createElement('article');
  card.className = `ledger-card p-4 transition-colors ${
    done ? 'domino-done-brutalist' : ''
  }`;
  card.setAttribute('data-domino-id', domino.id);
  card.setAttribute('data-state', done ? 'completed' : 'pending');

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <!-- Step Code & Time Specifications -->
        <div class="flex items-center gap-2 flex-wrap font-mono text-[11px]">
          <span class="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
            ${domino.badge}
          </span>
          <span class="text-[var(--muted)]">${domino.offset}</span>
          <span class="font-semibold text-[var(--text)] tabular-nums flex items-center gap-1" title="Minimum required floor">
            <span class="w-3 h-3 text-[var(--muted)]">${icon('timer')}</span>
            ${formatMins(mins)}
          </span>
          <span class="text-[var(--chart-accent)] font-bold text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded-[2px] border border-[var(--border)] tabular-nums ml-auto" title="Total hours logged across all days">
            Σ ${formatHours(cumulativeMins)}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-[15px] font-semibold mt-2 ${
          done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
        }">${domino.title}</h3>

        <!-- Subtitle & Technical Instructions -->
        ${domino.subtitle ? `<p class="text-xs font-mono text-[var(--muted)] mt-0.5">${domino.subtitle}</p>` : ''}
        <p class="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">${domino.desc}</p>
      </div>

      <!-- Tactile Check Trigger -->
      <button
        class="check-btn w-10 h-10 rounded-[2px] flex items-center justify-center border transition-colors shrink-0 touch-manipulation active:scale-95 ${
          done
            ? 'bg-[var(--text)] border-[var(--text)] text-[var(--surface)]'
            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--control)] hover:border-[var(--text)] hover:text-[var(--text)]'
        }"
        aria-label="${done ? 'Mark incomplete' : 'Mark complete'}: ${domino.title}"
        aria-pressed="${done}"
      >
        <span class="w-5 h-5">${icon('check')}</span>
      </button>
    </div>

    <!-- Operational Ledger Footer: Floor Specification & Timer Launcher -->
    <div class="mt-3.5 pt-2.5 border-t border-[var(--rule)] flex items-center justify-between font-mono text-xs">
      <div>
        ${
          done
            ? `
          <button class="duration-btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] font-mono text-[11px] font-bold hover:border-[var(--control)] touch-manipulation active:scale-95" title="Tap to adjust logged time">
            <span class="w-3 h-3 text-[var(--chart-accent)]">${icon('timer')}</span>
            <span>${formatDetailedHours(loggedMins)}</span>
            ${isUnderFloor ? '<span class="text-[var(--warning)] text-[9px] font-bold">UNDER</span>' : ''}
            ${isOverFloor ? '<span class="text-[var(--chart-accent)] text-[9px] font-bold">+EXTRA</span>' : ''}
          </button>
        `
            : `
          <button class="duration-btn text-[var(--muted)] hover:text-[var(--text)] uppercase text-[10px] tracking-wider font-mono hover:underline touch-manipulation" title="Tap to log time">
            FLOOR: ${formatMins(mins)}
          </button>
        `
        }
      </div>
      <div class="flex items-center gap-1.5">
        ${
          isPaperDomino
            ? `
          <button
            class="proctor-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[var(--surface)] hover:bg-[var(--raised)] text-[var(--text)] border border-[var(--border)] font-semibold transition-colors touch-manipulation active:scale-95"
            aria-label="Open Studio Proctor HUD with today's questions"
          >
            <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('book')}</span>
            STUDIO PROCTOR
          </button>
        `
            : ''
        }
        <button
          class="timer-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--raised)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] font-semibold transition-colors touch-manipulation active:scale-95"
          aria-label="Start ${formatMins(mins)} timer for ${domino.title}"
        >
          <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('play')}</span>
          RUN ${formatMins(mins)}
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
      // Trigger tactile relay sound & haptic vibration
      playDing();
      vibrateTap();

      // Trigger high-contrast border ripple / pulse
      card.classList.remove('border-pulse-active');
      void card.offsetWidth; // Force DOM reflow to re-trigger animation
      card.classList.add('border-pulse-active');
    }
  });

  // Bind duration button click to adjust logged duration
  const durationBtn = card.querySelector('.duration-btn');
  if (durationBtn) {
    durationBtn.addEventListener('click', () => {
      showDurationModal(domino, dateStr);
    });
  }

  // Bind timer trigger
  const timerBtn = card.querySelector('.timer-btn');
  timerBtn.addEventListener('click', () => {
    if (onTimerStart) {
      onTimerStart(domino, mins);
    }
  });

  // Bind studio proctor trigger
  if (isPaperDomino) {
    const proctorBtn = card.querySelector('.proctor-btn');
    if (proctorBtn) {
      proctorBtn.addEventListener('click', () => {
        if (onOpenStudio) {
          onOpenStudio(dateStr);
        } else {
          window.location.hash = `#/studio?date=${dateStr}`;
        }
      });
    }
  }

  return card;
}
