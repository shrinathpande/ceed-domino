/**
 * Timer Modal — full-width overlay for active countdown timer.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord } from '../core/state.js';
import { startTimer, stopTimer, togglePause, isTimerActive, isTimerPaused, getTimerState, formatTimer, resumePersistedTimer } from '../core/timer.js';
import { toggleDomino } from '../core/streak.js';
import { showToast } from '../components/header.js';
import { showNotification } from '../core/notifications.js';

let _modalEl = null;
let _onClose = null;

/** Show the timer modal */
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

      // Change color when close to completion
      if (remaining <= 60) {
        displayEl.classList.add('text-red-500');
        displayEl.classList.remove('text-gray-900', 'dark:text-white');
      }
    },
    onComplete: (state) => {
      displayEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      showNotification(`${domino.title} Timer Complete!`, {
        body: 'Great work! Mark it as done.',
      });
      showToast(`${domino.title} complete! 🎉`, 'success');

      // Auto-complete the domino
      const day = ensureDayRecord(dateStr);
      if (!day.completed[domino.id]) {
        toggleDomino(domino.id, dateStr);
      }
    },
  });

  // Pause/Resume
  pauseBtn.addEventListener('click', () => {
    const paused = togglePause();
    pauseBtn.innerHTML = `<span class="w-5 h-5">${icon(paused ? 'play' : 'pause')}</span> ${paused ? 'Resume' : 'Pause'}`;
  });

  // Mark Done
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

  // Close
  closeBtn.addEventListener('click', () => {
    stopTimer();
    hideTimerModal();
  });

  // Show with animation
  _modalEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    _modalEl.classList.add('opacity-100');
    _modalEl.querySelector('.timer-panel').classList.add('translate-y-0');
    _modalEl.querySelector('.timer-panel').classList.remove('translate-y-full');
  });
}

/** Hide the timer modal */
export function hideTimerModal() {
  if (!_modalEl) return;
  _modalEl.classList.remove('opacity-100');
  _modalEl.querySelector('.timer-panel').classList.add('translate-y-full');
  setTimeout(() => {
    _modalEl.classList.add('hidden');
    if (_onClose) _onClose();
  }, 300);
}

/** Create the modal DOM (once) */
function createModalDOM() {
  if (_modalEl) return;

  _modalEl = document.createElement('div');
  _modalEl.className = 'fixed inset-0 z-50 bg-black/30 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.setAttribute('aria-label', 'Domino countdown timer');

  _modalEl.innerHTML = `
    <div class="timer-panel absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl p-6 pb-8 translate-y-full transition-transform duration-300 ease-out max-w-lg mx-auto">
      <!-- Handle -->
      <div class="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-5"></div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500" id="timerBadge">DOMINO 1</span>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mt-0.5" id="timerTitle">Timer</h3>
        </div>
        <button id="timerCloseBtn" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors" aria-label="Close timer">
          <span class="w-4 h-4">${icon('close')}</span>
        </button>
      </div>

      <!-- Timer Display -->
      <div class="text-center mb-6">
        <div id="timerDigits" class="text-6xl font-mono font-black tracking-wider text-gray-900 dark:text-white tabular-nums">
          00:00:00
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 mb-6 overflow-hidden">
        <div id="timerProgress" class="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-linear" style="width: 0%"></div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-3">
        <button id="timerPauseBtn" class="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors touch-manipulation active:scale-[0.98]">
          <span class="w-5 h-5">${icon('pause')}</span>
          Pause
        </button>
        <button id="timerDoneBtn" class="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors touch-manipulation active:scale-[0.98]">
          <span class="w-5 h-5">${icon('check')}</span>
          Done
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(_modalEl);
}

/** Try to resume a persisted timer on page load */
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
      showNotification(`${state.dominoTitle} Timer Complete!`, {
        body: 'Great work!',
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
