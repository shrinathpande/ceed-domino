/**
 * Dashboard View — Industrial Brutalist Master Console.
 */
import { getState, ensureDayRecord } from '../core/state.js';
import { getDominos } from '../core/dominos.js';
import { toggleEmergencyMode } from '../core/streak.js';
import { icon } from '../icons/index.js';
import { getCurrentDateStr } from '../utils/dates.js';
import { renderHeader, showToast } from '../components/header.js';
import { renderDominoCard } from '../components/domino-card.js';
import { renderHeatmap } from './heatmap.js';
import { showTimerModal, tryResumeTimer } from './timer-modal.js';
import { requestNotificationPermission } from '../core/notifications.js';

let _currentDateStr = null;
let _container = null;

export function renderDashboard(container, onNavigateSettings) {
  _container = container;
  _currentDateStr = _currentDateStr || getCurrentDateStr();

  container.innerHTML = `
    <div id="headerContainer"></div>
    <main class="max-w-xl mx-auto px-4 pt-4 space-y-3 pb-24" role="main">
      <!-- Active Date Ledger & Emergency Switch -->
      <div id="dateBar" class="ledger-card p-3 flex items-center justify-between"></div>

      <!-- Domino Tasks Stream -->
      <div id="dominoList" class="space-y-2.5" role="list" aria-label="Domino pillars"></div>

      <!-- 87-Day Momentum Grid -->
      <div id="heatmapContainer"></div>

      <!-- Console Footer -->
      <footer class="text-center py-5 border-t border-[var(--rule)]">
        <button id="settingsBtn" class="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors touch-manipulation" aria-label="Open system settings">
          <span class="w-3.5 h-3.5">${icon('settings')}</span>
          SYSTEM SETTINGS & CONFIG
        </button>
      </footer>
    </main>
  `;

  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
  renderHeatmapSection();
  applyEmergencyUIState();

  tryResumeTimer(_currentDateStr);
  requestNotificationPermission();

  container.querySelector('#settingsBtn').addEventListener('click', () => {
    // Ensure emergency class doesn't leak into settings unless on dashboard
    document.body.classList.remove('emergency-active-theme');
    if (onNavigateSettings) onNavigateSettings();
  });

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
      <label for="datePicker" class="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold block">ACTIVE DATE</label>
      <input type="date" id="datePicker" value="${_currentDateStr}"
        min="${state.settings.startDate}" max="${state.settings.endDate}"
        class="bg-transparent text-sm font-mono font-bold text-[var(--text)] focus:outline-none mt-0.5 cursor-pointer" />
    </div>
    <button id="emergencyBtn"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-semibold border transition-colors touch-manipulation active:scale-95 ${
        day.emergency
          ? 'bg-[var(--surface)] border-[var(--negative)] text-[var(--negative)] font-bold'
          : 'bg-[var(--raised)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--control)] hover:text-[var(--text)]'
      }"
      aria-label="${day.emergency ? 'Disable emergency minimum floor' : 'Activate 3h 15m emergency minimum floor'}"
      aria-pressed="${day.emergency}"
    >
      <span class="w-3.5 h-3.5 ${day.emergency ? 'text-[var(--negative)]' : 'text-[var(--muted)]'}">${icon('warning')}</span>
      <span>${day.emergency ? 'BAD DAY FLOOR: ON (3h 15m)' : 'EMERGENCY MODE: OFF'}</span>
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
    const card = renderDominoCard(domino, _currentDateStr, (dom, mins) => {
      showTimerModal(dom, mins, _currentDateStr, () => {
        refreshDashboard();
      });
    });
    card.setAttribute('role', 'listitem');
    list.appendChild(card);
  });
}

function renderHeatmapSection() {
  const heatmapContainer = _container.querySelector('#heatmapContainer');
  renderHeatmap(heatmapContainer, _currentDateStr, (dateStr) => {
    _currentDateStr = dateStr;
    refreshDashboard();
  });
}

function refreshDashboard() {
  applyEmergencyUIState();
  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
  renderHeatmapSection();
}

document.addEventListener('state-changed', () => {
  if (_container && _container.querySelector('#dominoList')) {
    refreshDashboard();
  }
});
