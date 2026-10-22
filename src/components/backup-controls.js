/**
 * Backup Controls Component — Industrial Brutalist Storage Module.
 */
import { exportStateAsJSON, importStateFromFile } from '../core/state.js';
import { icon } from '../icons/index.js';
import { showToast } from './header.js';

export function renderBackupControls(container) {
  const section = document.createElement('section');
  section.className = 'ledger-card p-4 font-mono';
  section.setAttribute('aria-label', 'Backup and restore controls');

  section.innerHTML = `
    <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">STATE ARCHIVE & RESTORE</h2>
    <p class="text-xs text-[var(--muted)] mt-1 font-sans">Momentum metrics are auto-saved to device storage. Export a timestamped JSON backup anytime.</p>
    <div class="flex gap-2.5 mt-3">
      <button id="exportBtn" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors touch-manipulation active:scale-[0.99]">
        <span class="w-3.5 h-3.5">${icon('download')}</span>
        EXPORT STATE
      </button>
      <label class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer touch-manipulation active:scale-[0.99]">
        <span class="w-3.5 h-3.5">${icon('upload')}</span>
        IMPORT STATE
        <input type="file" accept=".json" class="hidden" id="importInput" />
      </label>
    </div>
  `;

  section.querySelector('#exportBtn').addEventListener('click', () => {
    exportStateAsJSON();
    showToast('State archive exported.', 'success');
  });

  section.querySelector('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importStateFromFile(file);
      showToast('State successfully restored.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  });

  container.appendChild(section);
}
