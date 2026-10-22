/**
 * Timer Modal — Industrial Brutalist Stopwatch Panel.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord } from '../core/state.js';
import { startTimer, stopTimer, togglePause, isTimerActive, isTimerPaused, getTimerState, formatTimer, resumePersistedTimer } from '../core/timer.js';
import { toggleDomino } from '../core/streak.js';
import { showToast } from '../components/header.js';
import { showNotification } from '../core/notifications.js';

let _modalEl = null;
let _onClose = null;

export function showTimerModal(domino, durationMins, dateStr, onClose) {
  _onClose = onClose;
  const totalSeconds = durationMins * 60;

  createModalDOM();

  const titleEl = _modalEl.querySelector('#timerTitle');
  const badgeEl = _modalEl.querySelector('#timerBadge');
  const displayEl = _modalEl.querySelector('#timerDigits');
  const pauseBtn = _modalEl.querySelector('#timerPauseBtn');
  const doneBtn = _modalEl.querySelector('#timerDoneBtn');
  const closeBtn = _modalEl.querySelector('#timerCloseBtn');
  const progressEl = _modalEl.querySelector('#timerProgress');

  titleEl.textContent = domino.title;
  badgeEl.textContent = domino.badge;

  startTimer({
    dominoId: domino.id,
    dominoTitle: domino.title,
    totalSeconds,
    onTick: (remaining, state) => {
      displayEl.textContent = formatTimer(remaining);
      const progress = 1 - remaining / totalSeconds;
      progressEl.style.width = `${progress * 100}%`;

      if (remaining <= 60) {
        displayEl.classList.add('text-[var(--negative)]');
      }
    },
    onComplete: (state) => {
      displayEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      showNotification(`${domino.title} Timer Complete`, {
        body: 'Mark domino complete.',
      });
      showToast(`${domino.title} complete.`, 'success');

      const day = ensureDayRecord(dateStr);
      if (!day.completed[domino.id]) {
        toggleDomino(domino.id, dateStr);
      }
    },
  });

  pauseBtn.addEventListener('click', () => {
    const paused = togglePause();
    pauseBtn.innerHTML = `<span class="w-4 h-4">${icon(paused ? 'play' : 'pause')}</span> ${paused ? 'RESUME' : 'PAUSE'}`;
  });

  doneBtn.addEventListener('click', () => {
    const state = getTimerState();
    if (state) {
      const day = ensureDayRecord(dateStr);
      if (!day.completed[state.dominoId]) {
        toggleDomino(state.dominoId, dateStr);
      }
    }
    hideTimerModal();
  });

  closeBtn.addEventListener('click', () => {
    stopTimer();
    hideTimerModal();
  });

  _modalEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    _modalEl.classList.add('opacity-100');
    _modalEl.querySelector('.timer-panel').classList.add('translate-y-0');
    _modalEl.querySelector('.timer-panel').classList.remove('translate-y-full');
  });
}

export function hideTimerModal() {
  if (!_modalEl) return;
  _modalEl.classList.remove('opacity-100');
  _modalEl.querySelector('.timer-panel').classList.add('translate-y-full');
  setTimeout(() => {
    _modalEl.classList.add('hidden');
    if (_onClose) _onClose();
  }, 150);
}

function createModalDOM() {
  if (_modalEl) return;

  _modalEl = document.createElement('div');
  _modalEl.className = 'fixed inset-0 z-50 bg-black/60 hidden opacity-0 transition-opacity duration-150 flex items-end justify-center';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.setAttribute('aria-label', 'Active domino countdown timer');

  _modalEl.innerHTML = `
    <div class="timer-panel w-full max-w-xl bg-[var(--surface)] border-t border-[var(--border)] p-6 translate-y-full transition-transform duration-200 ease-out">
      <!-- Instrument Header -->
      <div class="flex items-center justify-between pb-4 border-b border-[var(--rule)]">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--muted)]" id="timerBadge">DOMINO</span>
          <h3 class="text-base font-bold text-[var(--text)] mt-0.5" id="timerTitle">Instrument Timer</h3>
        </div>
        <button id="timerCloseBtn" class="w-7 h-7 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="Abort timer">
          <span class="w-3.5 h-3.5">${icon('close')}</span>
        </button>
      </div>

      <!-- High Precision Time Display -->
      <div class="my-6 text-center">
        <div id="timerDigits" class="text-6xl font-mono font-bold tracking-tight text-[var(--text)] tabular-nums">
          00:00:00
        </div>
      </div>

      <!-- Progress Track -->
      <div class="w-full h-1.5 bg-[var(--border)] rounded-[1px] mb-6 overflow-hidden">
        <div id="timerProgress" class="h-full bg-[var(--chart-accent)] transition-[width] duration-1000 ease-linear" style="width: 0%"></div>
      </div>

      <!-- Command Controls -->
      <div class="flex gap-2.5 font-mono text-xs">
        <button id="timerPauseBtn" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] font-bold hover:bg-[var(--border)] transition-colors touch-manipulation active:scale-[0.99]">
          <span class="w-4 h-4">${icon('pause')}</span>
          PAUSE
        </button>
        <button id="timerDoneBtn" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)] font-bold hover:opacity-90 transition-opacity touch-manipulation active:scale-[0.99]">
          <span class="w-4 h-4">${icon('check')}</span>
          COMPLETE NOW
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(_modalEl);
}

export function tryResumeTimer(dateStr) {
  const state = getTimerState();
  if (!state) return false;

  createModalDOM();
  const titleEl = _modalEl.querySelector('#timerTitle');
  const badgeEl = _modalEl.querySelector('#timerBadge');
  const displayEl = _modalEl.querySelector('#timerDigits');
  const progressEl = _modalEl.querySelector('#timerProgress');

  titleEl.textContent = state.dominoTitle;
  badgeEl.textContent = 'RESUMED';

  const resumed = resumePersistedTimer({
    onTick: (remaining) => {
      displayEl.textContent = formatTimer(remaining);
      const progress = 1 - remaining / state.totalSeconds;
      progressEl.style.width = `${progress * 100}%`;
    },
    onComplete: () => {
      displayEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      showNotification(`${state.dominoTitle} Timer Complete`, {
        body: 'Mark domino complete.',
      });
    },
  });

  if (resumed) {
    _modalEl.classList.remove('hidden');
    requestAnimationFrame(() => {
      _modalEl.classList.add('opacity-100');
      _modalEl.querySelector('.timer-panel').classList.add('translate-y-0');
      _modalEl.querySelector('.timer-panel').classList.remove('translate-y-full');
    });
  }

  return resumed;
}
