/**
 * Timer Modal — Industrial Brutalist Stopwatch Panel.
 * Supports Ambient Fullscreen Focus Mode, keyboard shortcuts, and clean lifecycle management.
 */
import { icon } from '../icons/index.js';
import { ensureDayRecord } from '../core/state.js';
import { startTimer, stopTimer, togglePause, isTimerActive, isTimerPaused, getTimerState, formatTimer, resumePersistedTimer, calcRemaining } from '../core/timer.js';
import { toggleDomino } from '../core/streak.js';
import { showToast } from '../components/header.js';
import { showNotification } from '../core/notifications.js';
import { showHonestModal } from '../components/honest-modal.js';

let _modalEl = null;
let _onClose = null;
let _isAmbientFullscreen = false;
let _activeDateStr = null;

export function showTimerModal(domino, durationMins, dateStr, onClose) {
  _onClose = onClose;
  _activeDateStr = dateStr;
  _isAmbientFullscreen = false;
  const totalSeconds = durationMins * 60;

  createModalDOM();

  const titleEl = _modalEl.querySelector('#timerTitle');
  const badgeEl = _modalEl.querySelector('#timerBadge');
  const displayEl = _modalEl.querySelector('#timerDigits');
  const pauseBtn = _modalEl.querySelector('#timerPauseBtn');
  const doneBtn = _modalEl.querySelector('#timerDoneBtn');
  const closeBtn = _modalEl.querySelector('#timerCloseBtn');
  const ambientBtn = _modalEl.querySelector('#ambientToggleBtn');
  const progressEl = _modalEl.querySelector('#timerProgress');
  const ambientSubtitle = _modalEl.querySelector('#ambientSubtitle');

  titleEl.textContent = domino.title;
  badgeEl.textContent = domino.badge;
  if (ambientSubtitle) ambientSubtitle.textContent = domino.subtitle || domino.desc || 'Stay locked in.';

  // Initial display setup
  displayEl.textContent = formatTimer(totalSeconds);
  progressEl.style.width = '0%';
  pauseBtn.innerHTML = `<span class="w-4 h-4">${icon('pause')}</span> PAUSE`;
  displayEl.classList.remove('text-[var(--negative)]');

  setAmbientMode(false);

  startTimer({
    dominoId: domino.id,
    dominoTitle: domino.title,
    totalSeconds,
    onTick: (remaining) => {
      displayEl.textContent = formatTimer(remaining);
      const progress = totalSeconds > 0 ? (1 - remaining / totalSeconds) : 0;
      progressEl.style.width = `${Math.min(100, progress * 100)}%`;

      if (remaining <= 60) {
        displayEl.classList.add('text-[var(--negative)]');
      } else {
        displayEl.classList.remove('text-[var(--negative)]');
      }
    },
    onComplete: (state) => {
      displayEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      showNotification(`${domino.title} Timer Complete`, {
        body: 'Time to rate your performance in Be Honest.',
      });
      showToast(`${domino.title} complete.`, 'success');

      if (_activeDateStr) {
        const day = ensureDayRecord(_activeDateStr);
        if (!day.completed[domino.id]) {
          toggleDomino(domino.id, _activeDateStr);
        }
        showHonestModal(domino, _activeDateStr);
      }
    },
  });

  pauseBtn.onclick = (e) => {
    e.stopPropagation();
    const paused = togglePause();
    pauseBtn.innerHTML = `<span class="w-4 h-4">${icon(paused ? 'play' : 'pause')}</span> ${paused ? 'RESUME' : 'PAUSE'}`;
  };

  doneBtn.onclick = (e) => {
    e.stopPropagation();
    const state = getTimerState();
    if (state && _activeDateStr) {
      const day = ensureDayRecord(_activeDateStr);
      if (!day.completed[state.dominoId]) {
        toggleDomino(state.dominoId, _activeDateStr);
      }
    }
    stopTimer();
    hideTimerModal();
    if (_activeDateStr) {
      showHonestModal(domino, _activeDateStr);
    }
  };

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    stopTimer();
    hideTimerModal();
  };

  ambientBtn.onclick = (e) => {
    e.stopPropagation();
    setAmbientMode(!_isAmbientFullscreen);
  };

  _modalEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    _modalEl.classList.add('opacity-100');
    _modalEl.querySelector('.timer-panel').classList.add('translate-y-0');
    _modalEl.querySelector('.timer-panel').classList.remove('translate-y-full');
  });
}

function setAmbientMode(enabled) {
  _isAmbientFullscreen = enabled;
  if (!_modalEl) return;

  const panel = _modalEl.querySelector('.timer-panel');
  const ambientBtn = _modalEl.querySelector('#ambientToggleBtn');
  const ambientHeader = _modalEl.querySelector('#ambientHeader');
  const digits = _modalEl.querySelector('#timerDigits');

  if (enabled) {
    panel.classList.remove('max-w-xl', 'border-t', 'p-6');
    panel.classList.add('fixed', 'inset-0', 'max-w-none', 'h-full', 'w-full', 'flex', 'flex-col', 'justify-between', 'p-8', 'z-50', 'bg-[var(--ground)]');
    
    ambientBtn.innerHTML = `<span class="w-4 h-4">${icon('minimize')}</span>`;
    ambientBtn.setAttribute('title', 'Exit Fullscreen Ambient Focus');
    
    digits.classList.remove('text-6xl', 'my-6');
    digits.classList.add('text-7xl', 'md:text-9xl', 'font-black', 'my-auto', 'tracking-tighter');
    
    if (ambientHeader) ambientHeader.classList.remove('hidden');
  } else {
    panel.classList.add('max-w-xl', 'border-t', 'p-6');
    panel.classList.remove('fixed', 'inset-0', 'max-w-none', 'h-full', 'w-full', 'flex', 'flex-col', 'justify-between', 'p-8', 'z-50', 'bg-[var(--ground)]');
    
    ambientBtn.innerHTML = `<span class="w-4 h-4">${icon('maximize')}</span>`;
    ambientBtn.setAttribute('title', 'Enter Fullscreen Ambient Focus');

    digits.classList.remove('text-7xl', 'md:text-9xl', 'font-black', 'my-auto', 'tracking-tighter');
    digits.classList.add('text-6xl', 'my-6');

    if (ambientHeader) ambientHeader.classList.add('hidden');
  }
}

export function hideTimerModal() {
  if (!_modalEl) return;
  setAmbientMode(false);
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
  _modalEl.className = 'fixed inset-0 z-50 bg-black/70 hidden opacity-0 transition-opacity duration-150 flex items-end justify-center font-mono';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.setAttribute('aria-label', 'Active domino countdown timer');

  _modalEl.innerHTML = `
    <div class="timer-panel w-full max-w-xl bg-[var(--surface)] border-t border-[var(--border)] p-6 translate-y-full transition-transform duration-200 ease-out">
      <!-- Normal Header -->
      <div id="normalHeader" class="flex items-center justify-between pb-3.5 border-b border-[var(--rule)]">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]" id="timerBadge">DOMINO</span>
          <h3 class="text-base font-bold text-[var(--text)] mt-0.5" id="timerTitle">Instrument Timer</h3>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="ambientToggleBtn" class="w-7 h-7 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors" title="Enter Fullscreen Ambient Focus">
            <span class="w-3.5 h-3.5">${icon('maximize')}</span>
          </button>
          <button id="timerCloseBtn" class="w-7 h-7 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="Abort timer">
            <span class="w-3.5 h-3.5">${icon('close')}</span>
          </button>
        </div>
      </div>

      <!-- Ambient Header (Fullscreen Only) -->
      <div id="ambientHeader" class="hidden text-center pt-4">
        <span class="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">AMBIENT FOCUS MODE</span>
        <p id="ambientSubtitle" class="text-xs text-[var(--text)] mt-1 font-sans"></p>
      </div>

      <!-- High Precision Time Display -->
      <div class="my-6 text-center select-none">
        <div id="timerDigits" class="text-6xl font-mono font-bold tracking-tight text-[var(--text)] tabular-nums">
          00:00:00
        </div>
      </div>

      <!-- Progress Track -->
      <div class="w-full h-1.5 bg-[var(--border)] rounded-[1px] mb-6 overflow-hidden">
        <div id="timerProgress" class="h-full bg-[var(--chart-accent)] transition-[width] duration-1000 ease-linear" style="width: 0%"></div>
      </div>

      <!-- Command Controls -->
      <div id="normalControls" class="flex gap-2.5 font-mono text-xs">
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

  window.addEventListener('keydown', (e) => {
    if (!_modalEl || _modalEl.classList.contains('hidden')) return;
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const pauseBtn = _modalEl.querySelector('#timerPauseBtn');
      if (pauseBtn) pauseBtn.click();
    } else if (e.code === 'Escape') {
      if (_isAmbientFullscreen) {
        setAmbientMode(false);
      } else {
        const closeBtn = _modalEl.querySelector('#timerCloseBtn');
        if (closeBtn) closeBtn.click();
      }
    }
  });
}

export function tryResumeTimer(dateStr) {
  const state = getTimerState();
  if (!state) return false;

  const remaining = calcRemaining(state);
  if (remaining <= 0) {
    stopTimer();
    return false;
  }

  _activeDateStr = dateStr;
  createModalDOM();
  const titleEl = _modalEl.querySelector('#timerTitle');
  const badgeEl = _modalEl.querySelector('#timerBadge');
  const displayEl = _modalEl.querySelector('#timerDigits');
  const progressEl = _modalEl.querySelector('#timerProgress');
  const pauseBtn = _modalEl.querySelector('#timerPauseBtn');
  const doneBtn = _modalEl.querySelector('#timerDoneBtn');
  const closeBtn = _modalEl.querySelector('#timerCloseBtn');
  const ambientBtn = _modalEl.querySelector('#ambientToggleBtn');

  titleEl.textContent = state.dominoTitle;
  badgeEl.textContent = 'ACTIVE';
  displayEl.textContent = formatTimer(remaining);
  const progress = state.totalSeconds > 0 ? (1 - remaining / state.totalSeconds) : 0;
  progressEl.style.width = `${Math.min(100, progress * 100)}%`;

  const isPaused = isTimerPaused();
  pauseBtn.innerHTML = `<span class="w-4 h-4">${icon(isPaused ? 'play' : 'pause')}</span> ${isPaused ? 'RESUME' : 'PAUSE'}`;

  pauseBtn.onclick = (e) => {
    e.stopPropagation();
    const paused = togglePause();
    pauseBtn.innerHTML = `<span class="w-4 h-4">${icon(paused ? 'play' : 'pause')}</span> ${paused ? 'RESUME' : 'PAUSE'}`;
  };

  doneBtn.onclick = (e) => {
    e.stopPropagation();
    const st = getTimerState();
    if (st && _activeDateStr) {
      const day = ensureDayRecord(_activeDateStr);
      if (!day.completed[st.dominoId]) {
        toggleDomino(st.dominoId, _activeDateStr);
      }
    }
    stopTimer();
    hideTimerModal();
  };

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    stopTimer();
    hideTimerModal();
  };

  ambientBtn.onclick = (e) => {
    e.stopPropagation();
    setAmbientMode(!_isAmbientFullscreen);
  };

  const resumed = resumePersistedTimer({
    onTick: (rem) => {
      displayEl.textContent = formatTimer(rem);
      const prog = state.totalSeconds > 0 ? (1 - rem / state.totalSeconds) : 0;
      progressEl.style.width = `${Math.min(100, prog * 100)}%`;
      if (rem <= 60) {
        displayEl.classList.add('text-[var(--negative)]');
      } else {
        displayEl.classList.remove('text-[var(--negative)]');
      }
    },
    onComplete: () => {
      displayEl.textContent = '00:00:00';
      progressEl.style.width = '100%';
      showNotification(`${state.dominoTitle} Timer Complete`, {
        body: 'Mark domino complete.',
      });
      if (_activeDateStr) {
        const day = ensureDayRecord(_activeDateStr);
        if (!day.completed[state.dominoId]) {
          toggleDomino(state.dominoId, _activeDateStr);
        }
      }
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
