/**
 * Backup Controls Component — export/import streak data.
 */
import { exportStateAsJSON, importStateFromFile } from '../core/state.js';
import { icon } from '../icons/index.js';
import { showToast } from './header.js';

/** Render backup controls section */
export function renderBackupControls(container) {
  const section = document.createElement('section');
  section.className = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 transition-colors';
  section.setAttribute('aria-label', 'Backup and restore controls');

  section.innerHTML = `
    <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Save & Restore Data</h2>
    <p class="text-xs text-gray-400 dark:text-zinc-500 mt-1">Your streak is saved automatically on this device. Export a backup anytime.</p>
    <div class="flex gap-2 mt-3">
      <button id="exportBtn" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors touch-manipulation active:scale-[0.98]">
        <span class="w-3.5 h-3.5">${icon('download')}</span>
        Export Backup
      </button>
      <label class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]">
        <span class="w-3.5 h-3.5">${icon('upload')}</span>
        Import Backup
        <input type="file" accept=".json" class="hidden" id="importInput" />
      </label>
    </div>
  `;

  // Bind events
  section.querySelector('#exportBtn').addEventListener('click', () => {
    exportStateAsJSON();
    showToast('Backup exported!', 'success');
  });

  section.querySelector('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importStateFromFile(file);
      showToast('Backup restored!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });

  container.appendChild(section);
}
