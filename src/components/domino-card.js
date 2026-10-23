/**
 * Domino Card Component — Industrial Brutalist Task Unit.
 * High-legibility typography, crisp border tokens, exact time budgets, and tactile feedback.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord, getDominoDuration, getCumulativeDominoMinutes, formatHours, formatDetailedHours } from '../core/state.js';
import { toggleDomino } from '../core/streak.js';
import { isDominoTask } from '../core/dominos.js';
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
  const isMandatory = isDominoTask(domino);

  const card = document.createElement('article');
  card.className = `ledger-card p-3 transition-colors ${
    isMandatory ? 'border-l-4 border-l-[var(--text)]' : 'border-l-4 border-l-transparent opacity-90'
  } ${
    done ? 'domino-done-brutalist' : ''
  }`;
  card.setAttribute('data-domino-id', domino.id);
  card.setAttribute('data-state', done ? 'completed' : 'pending');

  card.innerHTML = `
    <div class="card-tap-zone flex items-start justify-between gap-2.5 cursor-pointer select-none touch-manipulation">
      <div class="flex-1 min-w-0">
        <!-- Step Code & Time Specifications -->
        <div class="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
          <span class="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
            ${domino.badge}
          </span>
          <span class="text-[var(--muted)]">${domino.offset}</span>
          <span class="font-semibold text-[var(--text)] tabular-nums flex items-center gap-0.5" title="Minimum required floor">
            <span class="w-3 h-3 text-[var(--muted)]">${icon('timer')}</span>
            ${formatMins(mins)}
          </span>
          ${
            isMandatory
              ? `
            <span class="text-[var(--chart-accent)] font-bold text-[10px] bg-[var(--surface)] px-1 py-0.5 rounded-[2px] border border-[var(--border)] tabular-nums ml-auto" title="Total hours logged across all days">
              Σ ${formatHours(cumulativeMins)}
            </span>
          `
              : ''
          }
        </div>

        <!-- Title & Visual Expand Indicator -->
        <div class="flex items-center justify-between gap-2 mt-1.5">
          <h3 class="text-sm font-semibold truncate ${
            done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
          }">${domino.title}</h3>
          ${
            domino.desc
              ? `
            <div class="w-5 h-5 flex items-center justify-center rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] text-[9px] shrink-0" title="Tap card to expand details">
              <span class="expand-icon inline-block transition-transform duration-200">▼</span>
            </div>
          `
              : ''
          }
        </div>

        <!-- Collapsible Description (hidden by default, expands on tap) -->
        <div class="card-desc-body hidden mt-2 pt-2 border-t border-[var(--rule)] text-xs text-[var(--muted)] font-sans">
          ${domino.subtitle ? `<p class="font-mono text-[11px] font-medium text-[var(--text)] mb-1">${domino.subtitle}</p>` : ''}
          <p class="leading-relaxed text-[var(--text)]/85">${domino.desc}</p>
        </div>
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
        <span class="w-4 h-4">${icon('check')}</span>
      </button>
    </div>

    <!-- Operational Ledger Footer: Floor Specification & Timer Launcher -->
    <div class="mt-2.5 pt-2 border-t border-[var(--rule)] flex items-center justify-between font-mono text-xs">
      <div>
        ${
          done
            ? `
          <button class="duration-btn inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] font-mono text-[10px] font-bold hover:border-[var(--control)] touch-manipulation active:scale-95" title="Tap to adjust logged time">
            <span class="w-3 h-3 text-[var(--chart-accent)]">${icon('timer')}</span>
            <span>${formatDetailedHours(loggedMins)}</span>
            ${isUnderFloor ? '<span class="text-[var(--warning)] text-[8px] font-bold">UNDER</span>' : ''}
            ${isOverFloor ? '<span class="text-[var(--chart-accent)] text-[8px] font-bold">+EXTRA</span>' : ''}
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
            class="proctor-btn inline-flex items-center gap-1 px-2 py-1 rounded-[2px] bg-[var(--surface)] hover:bg-[var(--raised)] text-[var(--text)] border border-[var(--border)] text-[11px] font-bold transition-colors touch-manipulation active:scale-95"
            aria-label="Open Studio Proctor HUD with today's questions"
          >
            <span class="w-3 h-3 text-[var(--chart-accent)]">${icon('book')}</span>
            PROCTOR
          </button>
        `
            : ''
        }
        <button
          class="timer-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[var(--raised)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] text-[11px] font-bold transition-colors touch-manipulation active:scale-95"
          aria-label="Start ${formatMins(mins)} timer for ${domino.title}"
        >
          <span class="w-3 h-3 text-[var(--chart-accent)]">${icon('play')}</span>
          ${formatMins(mins)}
        </button>
      </div>
    </div>
  `;

  // Bind whole-card tap-to-expand
  const tapZone = card.querySelector('.card-tap-zone');
  if (tapZone) {
    tapZone.addEventListener('click', (e) => {
      // Ignore click if clicking the check button
      if (e.target.closest('.check-btn')) return;

      const descBody = card.querySelector('.card-desc-body');
      const expandIcon = card.querySelector('.expand-icon');
      if (descBody && domino.desc) {
        const isHidden = descBody.classList.contains('hidden');
        vibrateTap();
        if (isHidden) {
          descBody.classList.remove('hidden');
          if (expandIcon) expandIcon.style.transform = 'rotate(180deg)';
          card.classList.add('ring-1', 'ring-[var(--border)]');
        } else {
          descBody.classList.add('hidden');
          if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
          card.classList.remove('ring-1', 'ring-[var(--border)]');
        }
      }
    });
  }

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
