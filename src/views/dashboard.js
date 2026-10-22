/**
 * Dashboard View — main screen with domino cards, header, emergency toggle, and heatmap.
 */
import { getState, ensureDayRecord } from '../core/state.js';
import { getDominos } from '../core/dominos.js';
import { toggleEmergencyMode } from '../core/streak.js';
import { icon } from '../icons/index.js';
import { getCurrentDateStr, getDayIndex } from '../utils/dates.js';
import { renderHeader, showToast } from '../components/header.js';
import { renderDominoCard } from '../components/domino-card.js';
import { renderHeatmap } from './heatmap.js';
import { showTimerModal, tryResumeTimer } from './timer-modal.js';
import { requestNotificationPermission } from '../core/notifications.js';

let _currentDateStr = null;
let _container = null;

/** Render the full dashboard */
export function renderDashboard(container, onNavigateSettings) {
  _container = container;
  _currentDateStr = _currentDateStr || getCurrentDateStr();

  container.innerHTML = `
    <div id="headerContainer"></div>
    <main class="max-w-lg mx-auto px-4 pt-4 space-y-3 pb-24" role="main">
      <!-- Date & Emergency Toggle -->
      <div id="dateBar" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-3.5 flex items-center justify-between transition-colors"></div>

      <!-- Domino Cards -->
      <div id="dominoList" class="space-y-3" role="list" aria-label="Domino blocks"></div>

      <!-- Heatmap -->
      <div id="heatmapContainer"></div>

      <!-- Footer -->
      <footer class="text-center py-4">
        <button id="settingsBtn" class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors touch-manipulation" aria-label="Open settings">
          <span class="w-4 h-4">${icon('settings')}</span>
          Settings
        </button>
      </footer>
    </main>
  `;

  // Render sub-sections
  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
  renderHeatmapSection();

  // Try to resume any persisted timer
  tryResumeTimer(_currentDateStr);

  // Ask for notification permission on first visit
  requestNotificationPermission();

  // Bind settings button
  container.querySelector('#settingsBtn').addEventListener('click', () => {
    if (onNavigateSettings) onNavigateSettings();
  });

  // Update wake clock every 15 seconds
  setInterval(() => {
    renderHeaderSection();
  }, 15000);
}

/** Re-render the header */
function renderHeaderSection() {
  const headerContainer = _container.querySelector('#headerContainer');
  if (headerContainer) {
    renderHeader(headerContainer, _currentDateStr);
  }
}

/** Render date bar with date picker and emergency toggle */
function renderDateBar() {
  const dateBar = _container.querySelector('#dateBar');
  const state = getState();
  const day = ensureDayRecord(_currentDateStr);

  dateBar.innerHTML = `
    <div>
      <label for="datePicker" class="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-bold block">Active Date</label>
      <input type="date" id="datePicker" value="${_currentDateStr}"
        min="${state.settings.startDate}" max="${state.settings.endDate}"
        class="bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none mt-0.5 cursor-pointer" />
    </div>
    <button id="emergencyBtn"
      class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all touch-manipulation active:scale-95 ${
        day.emergency
          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400'
      }"
      aria-label="${day.emergency ? 'Disable emergency mode' : 'Enable emergency mode'}"
      aria-pressed="${day.emergency}"
    >
      <span class="w-3.5 h-3.5">${icon('warning')}</span>
      <span>${day.emergency ? 'Bad Day: ON' : 'Bad Day: OFF'}</span>
    </button>
  `;

  // Bind date picker
  dateBar.querySelector('#datePicker').addEventListener('change', (e) => {
    _currentDateStr = e.target.value;
    refreshDashboard();
  });

  // Bind emergency toggle
  dateBar.querySelector('#emergencyBtn').addEventListener('click', () => {
    const result = toggleEmergencyMode(_currentDateStr);
    if (!result.success) {
      showToast(result.message, 'warning');
    } else {
      refreshDashboard();
    }
  });
}

/** Render domino cards */
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

/** Render heatmap section */
function renderHeatmapSection() {
  const heatmapContainer = _container.querySelector('#heatmapContainer');
  renderHeatmap(heatmapContainer, _currentDateStr, (dateStr) => {
    _currentDateStr = dateStr;
    refreshDashboard();
  });
}

/** Refresh the entire dashboard (called after state changes) */
function refreshDashboard() {
  renderHeaderSection();
  renderDateBar();
  renderDominoCards();
  renderHeatmapSection();
}

/** Listen for state changes to auto-refresh */
document.addEventListener('state-changed', () => {
  if (_container && _container.querySelector('#dominoList')) {
    refreshDashboard();
  }
});
