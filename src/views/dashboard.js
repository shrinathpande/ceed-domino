/**
 * Dashboard View — Industrial Brutalist Master Console.
 * Focused directly on Today's Action: Active Date, Dominos Stream, and Timer triggers.
 */
import { getState, ensureDayRecord } from '../core/state.js';
import { getDominos } from '../core/dominos.js';
import { toggleEmergencyMode } from '../core/streak.js';
import { icon } from '../icons/index.js';
import { getCurrentDateStr } from '../utils/dates.js';
import { renderHeader, showToast } from '../components/header.js';
import { renderDominoCard } from '../components/domino-card.js';
import { showTimerModal, tryResumeTimer } from './timer-modal.js';
import { requestNotificationPermission } from '../core/notifications.js';

let _currentDateStr = null;
let _container = null;

export function renderDashboard(container, onNavigateSettings, targetDateStr = null) {
  _container = container;
  if (targetDateStr) {
    _currentDateStr = targetDateStr;
  } else {
    _currentDateStr = _currentDateStr || getCurrentDateStr();
  }

  container.innerHTML = `
    <div id="headerContainer"></div>
    <main class="max-w-xl mx-auto px-3 pt-3 space-y-2.5 pb-28" role="main">
      <!-- Active Date Ledger & Emergency Switch -->
      <div id="dateBar" class="ledger-card p-2.5 flex items-center justify-between"></div>

      <!-- Domino Tasks Stream -->
      <div id="dominoList" class="space-y-2" role="list" aria-label="Domino pillars"></div>

      <!-- Quick Navigation to Athletic Telemetry -->
      <div class="pt-2">
        <a href="#/stats" class="ledger-card p-3 flex items-center justify-between hover:border-[var(--control)] transition-colors text-xs font-mono">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 text-emerald-500">${icon('activity')}</span>
            <div>
              <span class="font-bold text-[var(--text)] block">VIEW PERFORMANCE TELEMETRY</span>
              <span class="text-[10px] text-[var(--muted)] font-sans">GitHub Contribution Matrix, Velocity, and Splits</span>
            </div>
          </div>
          <span class="text-[var(--muted)] text-sm">→</span>
        </a>
      </div>
    </main>
  `;

  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
  applyEmergencyUIState();

  tryResumeTimer(_currentDateStr);
  requestNotificationPermission();

  setInterval(() => {
    renderHeaderSection();
  }, 15000);
}

function applyEmergencyUIState() {
  const day = ensureDayRecord(_currentDateStr);
  if (day.emergency) {
    document.body.classList.add('emergency-active-theme');
  } else {
    document.body.classList.remove('emergency-active-theme');
  }
}

function renderHeaderSection() {
  const headerContainer = _container.querySelector('#headerContainer');
  if (headerContainer) {
    renderHeader(headerContainer, _currentDateStr);
  }
}

function renderDateBar() {
  const dateBar = _container.querySelector('#dateBar');
  const state = getState();
  const day = ensureDayRecord(_currentDateStr);

  dateBar.innerHTML = `
    <div>
      <label for="datePicker" class="text-[9px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold block">DATE</label>
      <input type="date" id="datePicker" value="${_currentDateStr}"
        min="${state.settings.startDate}" max="${state.settings.endDate}"
        class="bg-transparent text-xs font-mono font-bold text-[var(--text)] focus:outline-none cursor-pointer" />
    </div>
    <button id="emergencyBtn"
      class="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-[11px] font-mono font-bold border transition-colors touch-manipulation active:scale-95 ${
        day.emergency
          ? 'bg-[var(--surface)] border-[var(--negative)] text-[var(--negative)]'
          : 'bg-[var(--raised)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--control)] hover:text-[var(--text)]'
      }"
      aria-label="${day.emergency ? 'Disable emergency floor' : 'Activate bad-day floor'}"
      aria-pressed="${day.emergency}"
    >
      <span class="w-3 h-3 ${day.emergency ? 'text-[var(--negative)]' : 'text-[var(--muted)]'}">${icon('warning')}</span>
      <span>${day.emergency ? 'BAD-DAY: ON' : 'BAD-DAY: OFF'}</span>
    </button>
  `;

  dateBar.querySelector('#datePicker').addEventListener('change', (e) => {
    _currentDateStr = e.target.value;
    refreshDashboard();
  });

  dateBar.querySelector('#emergencyBtn').addEventListener('click', () => {
    const result = toggleEmergencyMode(_currentDateStr);
    if (!result.success) {
      showToast(result.message, 'warning');
    } else {
      refreshDashboard();
    }
  });
}

function renderDominoCards() {
  const list = _container.querySelector('#dominoList');
  list.innerHTML = '';

  const dominos = getDominos();
  dominos.forEach((domino) => {
    const card = renderDominoCard(
      domino,
      _currentDateStr,
      (dom, mins) => {
        showTimerModal(dom, mins, _currentDateStr, () => {
          refreshDashboard();
        });
      },
      (dateStr) => {
        window.location.hash = `#/studio?date=${dateStr}`;
      }
    );
    card.setAttribute('role', 'listitem');
    list.appendChild(card);
  });
}

function refreshDashboard() {
  applyEmergencyUIState();
  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
}

document.addEventListener('state-changed', () => {
  if (_container && _container.querySelector('#dominoList')) {
    refreshDashboard();
  }
});
