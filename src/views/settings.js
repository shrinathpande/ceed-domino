/**
 * Settings View — exam dates, domino customization, theme, backup, reset.
 */
import { getState, updateSettings, resetState } from '../core/state.js';
import { DEFAULT_DOMINOS, getDominos } from '../core/dominos.js';
import { icon } from '../icons/index.js';
import { applyTheme } from '../components/theme-toggle.js';
import { renderBackupControls } from '../components/backup-controls.js';
import { showToast } from '../components/header.js';
import { formatMins } from '../utils/format.js';

/** Render the settings view */
export function renderSettings(container, onBack) {
  const state = getState();
  const dominos = getDominos();

  container.innerHTML = `
    <div class="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      <!-- Back Button -->
      <button id="settingsBackBtn" class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 touch-manipulation" aria-label="Go back to dashboard">
        <span class="w-4 h-4">${icon('arrowLeft')}</span>
        Dashboard
      </button>

      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <!-- Exam Dates -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 transition-colors" aria-label="Exam date settings">
        <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Exam Dates</h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="startDateInput" class="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Start Date</label>
            <input type="date" id="startDateInput" value="${state.settings.startDate}"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label for="endDateInput" class="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">End Date (Exam Day)</label>
            <input type="date" id="endDateInput" value="${state.settings.endDate}"
              class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button id="saveDatesBtn" class="mt-3 w-full py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors touch-manipulation active:scale-[0.98]">
          Save Dates
        </button>
      </section>

      <!-- Theme -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 transition-colors" aria-label="Theme settings">
        <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Appearance</h2>
        <div class="flex gap-2">
          <button data-theme-choice="light" class="theme-btn flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors touch-manipulation ${state.settings.theme === 'light' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'}">
            Light
          </button>
          <button data-theme-choice="dark" class="theme-btn flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors touch-manipulation ${state.settings.theme === 'dark' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'}">
            Dark
          </button>
          <button data-theme-choice="system" class="theme-btn flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors touch-manipulation ${state.settings.theme === 'system' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700'}">
            System
          </button>
        </div>
      </section>

      <!-- Domino Customization -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 transition-colors" aria-label="Domino block customization">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Domino Blocks</h2>
          <button id="resetDominosBtn" class="text-[11px] font-medium text-blue-500 hover:text-blue-600 touch-manipulation">
            Reset to Defaults
          </button>
        </div>
        <div id="dominoSettingsList" class="space-y-2"></div>
        <button id="addDominoBtn" class="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-400 dark:text-zinc-500 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-500 transition-colors touch-manipulation">
          <span class="w-3.5 h-3.5">${icon('plus')}</span>
          Add Custom Domino
        </button>
      </section>

      <!-- Backup Controls -->
      <div id="backupSection"></div>

      <!-- Danger Zone -->
      <section class="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-500/20 p-4 transition-colors">
        <h2 class="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Danger Zone</h2>
        <p class="text-xs text-gray-400 dark:text-zinc-500 mb-3">This will permanently delete all your streak data, XP, and settings.</p>
        <button id="resetAllBtn" class="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors touch-manipulation active:scale-[0.98]">
          <span class="w-3.5 h-3.5 inline">${icon('trash')}</span>
          Reset All Data
        </button>
      </section>
    </div>
  `;

  // Render domino items
  const dominoList = container.querySelector('#dominoSettingsList');
  dominos.forEach((d, index) => {
    const item = document.createElement('div');
    item.className = 'flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800';
    item.innerHTML = `
      <span class="w-4 h-4 text-gray-400 dark:text-zinc-500 cursor-grab">${icon('gripVertical')}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${d.title}</p>
        <p class="text-[11px] text-gray-400 dark:text-zinc-500">${formatMins(d.normalMins)} floor · ${d.emergencyMins}m emergency</p>
      </div>
      <span class="text-[11px] font-mono text-gray-400 dark:text-zinc-500">${d.badge}</span>
    `;
    dominoList.appendChild(item);
  });

  // Render backup controls
  renderBackupControls(container.querySelector('#backupSection'));

  // Bind events
  container.querySelector('#settingsBackBtn').addEventListener('click', () => {
    if (onBack) onBack();
  });

  container.querySelector('#saveDatesBtn').addEventListener('click', () => {
    const start = container.querySelector('#startDateInput').value;
    const end = container.querySelector('#endDateInput').value;
    if (start && end && start < end) {
      updateSettings({ startDate: start, endDate: end });
      showToast('Dates updated!', 'success');
    } else {
      showToast('Invalid date range', 'error');
    }
  });

  container.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.themeChoice;
      updateSettings({ theme: choice });
      applyTheme();
      // Re-render settings to update active states
      renderSettings(container, onBack);
    });
  });

  container.querySelector('#resetDominosBtn').addEventListener('click', () => {
    updateSettings({ customDominos: null });
    renderSettings(container, onBack);
    showToast('Dominos reset to defaults', 'success');
  });

  container.querySelector('#resetAllBtn').addEventListener('click', () => {
    if (confirm('⚠️ Are you sure? This will permanently delete ALL your streak data, XP, shields, and settings.')) {
      resetState();
      showToast('All data has been reset', 'info');
      if (onBack) onBack();
    }
  });
}
