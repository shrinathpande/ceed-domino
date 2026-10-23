/**
 * Be Honest Rating Modal — Tactile 1-tap quality evaluation for completed tasks.
 * Rating scale (1 to 5):
 * 1: I did not do the task as I wanted to (Off-target / Poor)
 * 2: Subpar execution / Low focus
 * 3: Baseline / Acceptable floor met
 * 4: Strong execution / High quality
 * 5: I did the task and I think it is a five (Flawless / Flow state)
 */
import { setDominoRating, getDominoRating, ensureDayRecord } from '../core/state.js';
import { icon } from '../icons/index.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap } from '../core/notifications.js';
import { showToast } from './header.js';

let _modalEl = null;

const RATINGS = [
  {
    score: 5,
    title: '5 · FLAWLESS / FLOW STATE',
    desc: 'I did the task and I think it is a five. Deep immersion, zero drift.',
  },
  {
    score: 4,
    title: '4 · STRONG EXECUTION',
    desc: 'High focus and output. Slight friction or minor pacing gap.',
  },
  {
    score: 3,
    title: '3 · BASELINE / ACCEPTABLE',
    desc: 'Completed the required floor. Moderate focus, satisfactory result.',
  },
  {
    score: 2,
    title: '2 · SUBPAR / DISTRACTED',
    desc: 'Struggled with inertia, broke discipline, or cut corners.',
  },
  {
    score: 1,
    title: '1 · OFF-TARGET / POOR',
    desc: 'I did not do the task as I wanted to. Below acceptable standard.',
  },
];

/** Show the Be Honest rating modal */
export function showHonestModal(domino, dateStr, onRated) {
  createModalDOM();

  const titleEl = _modalEl.querySelector('#honestTaskTitle');
  const badgeEl = _modalEl.querySelector('#honestTaskBadge');
  const optionsContainer = _modalEl.querySelector('#honestOptionsList');
  const currentRating = getDominoRating(domino.id, dateStr);

  titleEl.textContent = domino.title;
  badgeEl.textContent = domino.badge || 'TASK';

  optionsContainer.innerHTML = RATINGS.map((r) => {
    const isCurrent = currentRating === r.score;
    return `
      <button data-score="${r.score}" class="honest-rating-btn w-full p-3 rounded-[2px] border text-left font-mono transition-colors touch-manipulation active:scale-[0.99] flex items-start gap-3 ${
        isCurrent
          ? 'bg-[var(--surface)] border-[var(--chart-accent)] text-[var(--text)] font-bold'
          : 'bg-[var(--raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--control)]'
      }">
        <span class="w-8 h-8 rounded-[2px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--text)] shrink-0 tabular-nums">
          ${r.score}
        </span>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-[var(--text)]">${r.title}</div>
          <div class="text-[11px] text-[var(--muted)] mt-0.5 font-sans leading-relaxed">${r.desc}</div>
        </div>
      </button>
    `;
  }).join('');

  // Bind rating buttons
  optionsContainer.querySelectorAll('.honest-rating-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.dataset.score, 10);
      setDominoRating(domino.id, dateStr, score);
      playDing();
      vibrateTap();
      hideHonestModal();
      showToast(`Be Honest: ${score}/5 saved for ${domino.title}`, 'success');
      if (onRated) onRated(score);
    });
  });

  // Bind close button
  const closeBtn = _modalEl.querySelector('#honestCloseBtn');
  closeBtn.onclick = () => {
    hideHonestModal();
  };

  // Animate in
  _modalEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    _modalEl.classList.add('opacity-100');
    _modalEl.querySelector('.honest-panel').classList.add('translate-y-0');
    _modalEl.querySelector('.honest-panel').classList.remove('translate-y-4');
  });
}

export function hideHonestModal() {
  if (!_modalEl) return;
  _modalEl.classList.remove('opacity-100');
  _modalEl.querySelector('.honest-panel').classList.add('translate-y-4');
  setTimeout(() => {
    _modalEl.classList.add('hidden');
  }, 200);
}

function createModalDOM() {
  if (_modalEl) return;

  _modalEl = document.createElement('div');
  _modalEl.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden opacity-0 transition-opacity duration-200 flex items-center justify-center p-4';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.setAttribute('aria-label', 'Be Honest quality rating');

  _modalEl.innerHTML = `
    <div class="honest-panel ledger-card w-full max-w-md p-5 space-y-4 shadow-2xl translate-y-4 transition-transform duration-200 bg-[var(--surface)]">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div class="flex items-center gap-2 font-mono text-[10px]">
            <span class="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider" id="honestTaskBadge">
              TASK
            </span>
            <span class="text-[var(--chart-accent)] font-bold uppercase tracking-wider">BE HONEST</span>
          </div>
          <h3 class="text-base font-bold text-[var(--text)] mt-1 font-mono" id="honestTaskTitle">
            Task Title
          </h3>
          <p class="text-xs text-[var(--muted)] font-sans mt-0.5">
            Rate your ability & execution quality honestly (1 to 5).
          </p>
        </div>
        <button id="honestCloseBtn" class="w-8 h-8 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="Skip rating">
          <span class="w-4 h-4">${icon('close')}</span>
        </button>
      </div>

      <!-- 1 to 5 Rating List -->
      <div id="honestOptionsList" class="space-y-2"></div>
    </div>
  `;

  document.body.appendChild(_modalEl);

  _modalEl.addEventListener('click', (e) => {
    if (e.target === _modalEl) {
      hideHonestModal();
    }
  });
}
