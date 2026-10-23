/**
 * Duration Modal — Industrial Brutalist Time Logger & Adjuster.
 * Allows candidates to record exact logged time (more or less than the required floor).
 */
import { ensureDayRecord, getDominoDuration, setDominoDuration, formatDetailedHours } from '../core/state.js';
import { formatMins } from '../utils/format.js';
import { icon } from '../icons/index.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap } from '../core/notifications.js';
import { showToast } from './header.js';

let _modalEl = null;

export function showDurationModal(domino, dateStr, onSaved) {
  createModalDOM();

  const day = ensureDayRecord(dateStr);
  const requiredMins = day.emergency ? domino.emergencyMins : domino.normalMins;
  let currentMins = getDominoDuration(domino.id, dateStr, requiredMins);
  if (currentMins === 0 && day.completed[domino.id]) {
    currentMins = requiredMins;
  } else if (currentMins === 0) {
    currentMins = requiredMins;
  }

  const titleEl = _modalEl.querySelector('#durationTaskTitle');
  const badgeEl = _modalEl.querySelector('#durationTaskBadge');
  const floorEl = _modalEl.querySelector('#durationFloorRequirement');
  const hoursInput = _modalEl.querySelector('#durationHoursInput');
  const minsInput = _modalEl.querySelector('#durationMinsInput');
  const feedbackEl = _modalEl.querySelector('#durationFeedbackBox');
  const saveBtn = _modalEl.querySelector('#durationSaveBtn');
  const closeBtn = _modalEl.querySelector('#durationCloseBtn');

  titleEl.textContent = domino.title;
  badgeEl.textContent = domino.badge || 'DOMINO';
  floorEl.textContent = `MINIMUM FLOOR: ${formatMins(requiredMins)}`;

  function updateInputsFromTotal(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    hoursInput.value = h;
    minsInput.value = m;
    updateFeedback(mins);
  }

  function getTotalFromInputs() {
    const h = Math.max(0, parseInt(hoursInput.value, 10) || 0);
    const m = Math.max(0, parseInt(minsInput.value, 10) || 0);
    return h * 60 + m;
  }

  function updateFeedback(totalMins) {
    const diff = totalMins - requiredMins;
    if (diff < 0) {
      feedbackEl.innerHTML = `
        <span class="text-[var(--warning)] font-bold">UNDER FLOOR (${Math.abs(diff)}m less than floor).</span>
        <span class="text-[var(--muted)] block mt-0.5">Still counts as complete towards your streak; logged hours reflect true effort.</span>
      `;
    } else if (diff > 0) {
      feedbackEl.innerHTML = `
        <span class="text-[var(--chart-accent)] font-bold">+${diff}m BONUS PUSH.</span>
        <span class="text-[var(--muted)] block mt-0.5">Logged above minimum required floor! Cumulative stats updated.</span>
      `;
    } else {
      feedbackEl.innerHTML = `
        <span class="text-[var(--text)] font-semibold">Exact required floor (${formatMins(requiredMins)}).</span>
      `;
    }
  }

  updateInputsFromTotal(currentMins);

  hoursInput.oninput = () => updateFeedback(getTotalFromInputs());
  minsInput.oninput = () => updateFeedback(getTotalFromInputs());

  // Quick Chips
  _modalEl.querySelectorAll('.quick-adjust-btn').forEach((btn) => {
    btn.onclick = () => {
      const delta = parseInt(btn.dataset.delta, 10);
      const newTotal = Math.max(0, getTotalFromInputs() + delta);
      updateInputsFromTotal(newTotal);
    };
  });

  _modalEl.querySelector('#resetFloorBtn').onclick = () => {
    updateInputsFromTotal(requiredMins);
  };

  saveBtn.onclick = () => {
    const total = getTotalFromInputs();
    setDominoDuration(domino.id, dateStr, total);
    playDing();
    vibrateTap();
    hideDurationModal();
    showToast(`Logged ${formatDetailedHours(total)} for ${domino.title}`, 'success');
    if (onSaved) onSaved(total);
  };

  closeBtn.onclick = () => {
    hideDurationModal();
  };

  _modalEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    _modalEl.classList.add('opacity-100');
    _modalEl.querySelector('.duration-panel').classList.add('translate-y-0');
    _modalEl.querySelector('.duration-panel').classList.remove('translate-y-4');
  });
}

export function hideDurationModal() {
  if (!_modalEl) return;
  _modalEl.classList.remove('opacity-100');
  _modalEl.querySelector('.duration-panel').classList.add('translate-y-4');
  setTimeout(() => {
    _modalEl.classList.add('hidden');
  }, 200);
}

function createModalDOM() {
  if (_modalEl) return;

  _modalEl = document.createElement('div');
  _modalEl.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden opacity-0 transition-opacity duration-200 flex items-center justify-center p-4 font-mono';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.setAttribute('aria-label', 'Adjust logged duration');

  _modalEl.innerHTML = `
    <div class="duration-panel ledger-card w-full max-w-sm p-5 space-y-4 shadow-2xl translate-y-4 transition-transform duration-200 bg-[var(--surface)]">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div class="flex items-center gap-2 text-[10px]">
            <span class="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider" id="durationTaskBadge">
              DOMINO
            </span>
            <span class="text-[var(--chart-accent)] font-bold uppercase tracking-wider" id="durationFloorRequirement">
              MINIMUM FLOOR: 2h 00m
            </span>
          </div>
          <h3 class="text-sm font-bold text-[var(--text)] mt-1 truncate" id="durationTaskTitle">
            Domino Title
          </h3>
        </div>
        <button id="durationCloseBtn" class="w-8 h-8 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="Cancel">
          <span class="w-4 h-4">${icon('close')}</span>
        </button>
      </div>

      <!-- Time Inputs: Hours & Minutes -->
      <div class="space-y-1.5">
        <label class="block text-[11px] text-[var(--muted)] uppercase font-semibold">
          ACTUAL TIME SPENT TODAY
        </label>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-1.5 bg-[var(--raised)] border border-[var(--border)] p-2 rounded-[2px]">
            <input type="number" id="durationHoursInput" min="0" max="24" step="1"
              class="w-full bg-transparent text-lg font-bold text-[var(--text)] text-center focus:outline-none tabular-nums" />
            <span class="text-xs text-[var(--muted)] font-bold pr-1">HRS</span>
          </div>
          <div class="flex items-center gap-1.5 bg-[var(--raised)] border border-[var(--border)] p-2 rounded-[2px]">
            <input type="number" id="durationMinsInput" min="0" max="59" step="5"
              class="w-full bg-transparent text-lg font-bold text-[var(--text)] text-center focus:outline-none tabular-nums" />
            <span class="text-xs text-[var(--muted)] font-bold pr-1">MINS</span>
          </div>
        </div>
      </div>

      <!-- Quick Adjustment Chips -->
      <div class="space-y-1">
        <span class="text-[10px] text-[var(--muted)] uppercase font-semibold">QUICK ADJUST</span>
        <div class="grid grid-cols-5 gap-1 text-[11px]">
          <button data-delta="-30" class="quick-adjust-btn py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">-30m</button>
          <button data-delta="-15" class="quick-adjust-btn py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">-15m</button>
          <button id="resetFloorBtn" class="py-1 rounded-[2px] bg-[var(--surface)] border border-[var(--chart-accent)] text-[var(--chart-accent)] font-bold hover:bg-[var(--raised)] transition-colors">FLOOR</button>
          <button data-delta="15" class="quick-adjust-btn py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">+15m</button>
          <button data-delta="30" class="quick-adjust-btn py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">+30m</button>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div id="durationFeedbackBox" class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[11px] leading-relaxed font-sans">
      </div>

      <!-- Save Button -->
      <button id="durationSaveBtn" class="w-full py-2.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)] text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-transform">
        SAVE TIME LOG
      </button>
    </div>
  `;

  document.body.appendChild(_modalEl);

  _modalEl.addEventListener('click', (e) => {
    if (e.target === _modalEl) {
      hideDurationModal();
    }
  });
}
