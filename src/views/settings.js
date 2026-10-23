/**
 * Settings View — Industrial Brutalist Configuration Terminal.
 * Full Domino Block editing, reordering, custom additions, date ranges, and appearance.
 */
import { getState, updateSettings, resetState } from '../core/state.js';
import { DEFAULT_DOMINOS, getDominos } from '../core/dominos.js';
import { icon } from '../icons/index.js';
import { applyTheme } from '../components/theme-toggle.js';
import { renderBackupControls } from '../components/backup-controls.js';
import { showToast } from '../components/header.js';
import { formatMins } from '../utils/format.js';

let _activeEditModal = null;

export function renderSettings(container, onBack) {
  const state = getState();
  const dominos = getDominos();

  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 font-mono">
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-3">
        <button id="settingsBackBtn" class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text)] hover:opacity-80 transition-opacity touch-manipulation" aria-label="Return to console">
          <span class="w-4 h-4">${icon('arrowLeft')}</span>
          DASHBOARD CONSOLE
        </button>
        <span class="text-xs text-[var(--muted)]">CONFIG TERMINAL</span>
      </div>

      <!-- Section: Exam Timeline Parameters -->
      <section class="ledger-card p-4" aria-label="Timeline parameters">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">EXAM CALENDAR TARGETS</h2>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label for="startDateInput" class="block font-medium text-[var(--muted)] mb-1">START DATE</label>
            <input type="date" id="startDateInput" value="${state.settings.startDate}"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
          <div>
            <label for="endDateInput" class="block font-medium text-[var(--muted)] mb-1">EXAM DATE</label>
            <input type="date" id="endDateInput" value="${state.settings.endDate}"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
        </div>
        <button id="saveDatesBtn" class="mt-3 w-full py-2 rounded-[2px] bg-[var(--text)] text-[var(--surface)] font-bold text-xs hover:opacity-90 transition-opacity touch-manipulation active:scale-[0.99]">
          SAVE TIMELINE
        </button>
      </section>

      <!-- Section: Display Mode -->
      <section class="ledger-card p-4" aria-label="Visual appearance mode">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">APPEARANCE THEME</h2>
        <div class="flex gap-2">
          <button data-theme-choice="light" class="theme-btn flex-1 py-2 rounded-[2px] text-xs font-bold border transition-colors touch-manipulation ${state.settings.theme === 'light' ? 'bg-[var(--text)] text-[var(--surface)] border-[var(--text)]' : 'bg-[var(--raised)] text-[var(--text)] border-[var(--border)] hover:border-[var(--control)]'}">
            LIGHT
          </button>
          <button data-theme-choice="dark" class="theme-btn flex-1 py-2 rounded-[2px] text-xs font-bold border transition-colors touch-manipulation ${state.settings.theme === 'dark' ? 'bg-[var(--text)] text-[var(--surface)] border-[var(--text)]' : 'bg-[var(--raised)] text-[var(--text)] border-[var(--border)] hover:border-[var(--control)]'}">
            DARK
          </button>
          <button data-theme-choice="system" class="theme-btn flex-1 py-2 rounded-[2px] text-xs font-bold border transition-colors touch-manipulation ${state.settings.theme === 'system' ? 'bg-[var(--text)] text-[var(--surface)] border-[var(--text)]' : 'bg-[var(--raised)] text-[var(--text)] border-[var(--border)] hover:border-[var(--control)]'}">
            AUTO
          </button>
        </div>
      </section>

      <!-- Section: Domino Task Blocks (Reorder & Edit) -->
      <section class="ledger-card p-4" aria-label="Domino pillars editor">
        <div class="flex items-center justify-between mb-3 border-b border-[var(--rule)] pb-2">
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">DOMINO PILLARS</h2>
            <p class="text-[10px] text-[var(--muted)] mt-0.5 font-sans">Use arrows to reorder, click edit to modify durations or names.</p>
          </div>
          <button id="resetDominosBtn" class="text-[11px] font-bold text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            DEFAULTS
          </button>
        </div>
        
        <div id="dominoSettingsList" class="space-y-2"></div>
        
        <button id="addDominoBtn" class="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-[2px] border border-dashed border-[var(--control)] text-xs font-bold text-[var(--text)] hover:bg-[var(--raised)] transition-colors touch-manipulation">
          <span class="w-3.5 h-3.5">${icon('plus')}</span>
          APPEND NEW DOMINO UNIT
        </button>
      </section>

      <!-- Section: State Backup Archive -->
      <div id="backupSection"></div>

      <!-- Section: System Wipe -->
      <section class="ledger-card p-4 border-[var(--negative)]">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--negative)] mb-1">DATA RESET TERMINAL</h2>
        <p class="text-xs text-[var(--muted)] mb-3 font-sans">Purges all local historical logs, active streak records, and quality scores back to factory reset.</p>
        <button id="resetAllBtn" class="w-full py-2 rounded-[2px] bg-[var(--raised)] border border-[var(--negative)] text-[var(--negative)] text-xs font-bold hover:bg-[var(--negative)] hover:text-white transition-colors touch-manipulation active:scale-[0.99]">
          PURGE ALL TRACKER DATA
        </button>
      </section>
    </div>

    <!-- Edit Domino Modal Placeholder -->
    <div id="editDominoModalContainer"></div>
  `;

  // Render Domino Items with Reordering and Editing
  renderDominoEditorItems(container, dominos, onBack);

  // Render Backup Controls
  renderBackupControls(container.querySelector('#backupSection'));

  // Wire Top Actions
  container.querySelector('#settingsBackBtn').addEventListener('click', () => {
    if (onBack) onBack();
  });

  container.querySelector('#saveDatesBtn').addEventListener('click', () => {
    const start = container.querySelector('#startDateInput').value;
    const end = container.querySelector('#endDateInput').value;
    if (start && end && start < end) {
      updateSettings({ startDate: start, endDate: end });
      showToast('Calendar targets updated.', 'success');
    } else {
      showToast('Invalid target range.', 'error');
    }
  });

  container.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.themeChoice;
      updateSettings({ theme: choice });
      applyTheme();
      renderSettings(container, onBack);
    });
  });

  container.querySelector('#resetDominosBtn').addEventListener('click', () => {
    updateSettings({ customDominos: null });
    renderSettings(container, onBack);
    showToast('Domino blocks reset to default blueprint.', 'success');
  });

  container.querySelector('#addDominoBtn').addEventListener('click', () => {
    showEditDominoModal(null, (newDomino) => {
      const current = [...getDominos()];
      current.push(newDomino);
      updateSettings({ customDominos: current });
      renderSettings(container, onBack);
      showToast(`Added ${newDomino.title}.`, 'success');
    });
  });

  container.querySelector('#resetAllBtn').addEventListener('click', () => {
    if (confirm('CRITICAL ACTION: Reset all tracking logs, streaks, and custom domino settings?')) {
      resetState();
      showToast('All state data purged.', 'info');
      if (onBack) onBack();
    }
  });
}

function renderDominoEditorItems(container, dominos, onBack) {
  const dominoList = container.querySelector('#dominoSettingsList');
  dominoList.innerHTML = '';

  dominos.forEach((d, index) => {
    const item = document.createElement('div');
    item.className = 'flex items-center gap-2 p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]';
    
    item.innerHTML = `
      <!-- Move Up/Down Controls -->
      <div class="flex flex-col gap-0.5">
        <button class="move-up-btn w-5 h-4 flex items-center justify-center text-[10px] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20" ${index === 0 ? 'disabled' : ''} title="Move up">
          ▲
        </button>
        <button class="move-down-btn w-5 h-4 flex items-center justify-center text-[10px] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20" ${index === dominos.length - 1 ? 'disabled' : ''} title="Move down">
          ▼
        </button>
      </div>

      <!-- Domino Details -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] font-bold px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-[1px]">${d.badge}</span>
          <p class="text-xs font-bold text-[var(--text)] truncate">${d.title}</p>
        </div>
        <p class="text-[10px] text-[var(--muted)] mt-0.5 font-sans">${formatMins(d.normalMins)} standard · ${d.emergencyMins}m emergency floor</p>
      </div>

      <!-- Edit & Delete Triggers -->
      <div class="flex items-center gap-1">
        <button class="edit-btn px-2 py-1 text-[11px] font-bold rounded-[2px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--control)] transition-colors" title="Edit Domino">
          EDIT
        </button>
        <button class="delete-btn px-2 py-1 text-[11px] font-bold rounded-[2px] bg-[var(--surface)] border border-[var(--border)] text-[var(--negative)] hover:bg-[var(--negative)] hover:text-white transition-colors" title="Delete Domino">
          DEL
        </button>
      </div>
    `;

    // Move Up
    item.querySelector('.move-up-btn').addEventListener('click', () => {
      if (index > 0) {
        const next = [...dominos];
        const [moved] = next.splice(index, 1);
        next.splice(index - 1, 0, moved);
        updateSettings({ customDominos: next });
        renderSettings(container, onBack);
      }
    });

    // Move Down
    item.querySelector('.move-down-btn').addEventListener('click', () => {
      if (index < dominos.length - 1) {
        const next = [...dominos];
        const [moved] = next.splice(index, 1);
        next.splice(index + 1, 0, moved);
        updateSettings({ customDominos: next });
        renderSettings(container, onBack);
      }
    });

    // Edit
    item.querySelector('.edit-btn').addEventListener('click', () => {
      showEditDominoModal(d, (updated) => {
        const next = [...dominos];
        next[index] = { ...d, ...updated };
        updateSettings({ customDominos: next });
        renderSettings(container, onBack);
        showToast(`Saved ${updated.title}.`, 'success');
      });
    });

    // Delete
    item.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm(`Remove "${d.title}" from domino schedule?`)) {
        const next = dominos.filter((_, i) => i !== index);
        updateSettings({ customDominos: next });
        renderSettings(container, onBack);
        showToast('Domino removed.', 'info');
      }
    });

    dominoList.appendChild(item);
  });
}

/**
 * Edit / Create Domino Modal
 */
function showEditDominoModal(existing, onSave) {
  const container = document.getElementById('editDominoModalContainer');
  if (!container) return;

  const isEdit = !!existing;
  const initial = existing || {
    id: `custom_${Date.now()}`,
    badge: 'DOMINO',
    title: '',
    subtitle: '',
    offset: 'Wake + 0:00',
    normalMins: 60,
    emergencyMins: 30,
    desc: '',
    icon: 'document',
    color: 'blue'
  };

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-mono';
  modal.innerHTML = `
    <div class="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl rounded-[2px] space-y-3.5">
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2.5">
        <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
          ${isEdit ? 'EDIT DOMINO SPECIFICATION' : 'NEW DOMINO SPECIFICATION'}
        </h3>
        <button id="closeEditModalBtn" class="text-xs text-[var(--muted)] hover:text-[var(--text)]">✕</button>
      </div>

      <div class="space-y-2.5 text-xs">
        <div>
          <label class="block text-[11px] text-[var(--muted)] mb-1">TITLE</label>
          <input type="text" id="editTitleInput" value="${initial.title}" placeholder="e.g. Speed Sketching Drills"
            class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] text-[var(--muted)] mb-1">BADGE CODE</label>
            <input type="text" id="editBadgeInput" value="${initial.badge}" placeholder="DOMINO 1"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
          <div>
            <label class="block text-[11px] text-[var(--muted)] mb-1">TIME OFFSET</label>
            <input type="text" id="editOffsetInput" value="${initial.offset}" placeholder="Wake + 2:00"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] text-[var(--muted)] mb-1">STANDARD FLOOR (MINS)</label>
            <input type="number" id="editNormalMinsInput" value="${initial.normalMins}" min="5" step="5"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
          <div>
            <label class="block text-[11px] text-[var(--muted)] mb-1">BAD DAY FLOOR (MINS)</label>
            <input type="number" id="editEmergencyMinsInput" value="${initial.emergencyMins}" min="5" step="5"
              class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] text-[var(--muted)] mb-1">SUBTITLE / FOCUS</label>
          <input type="text" id="editSubtitleInput" value="${initial.subtitle || ''}" placeholder="e.g. Perspective & Proportion"
            class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]" />
        </div>

        <div>
          <label class="block text-[11px] text-[var(--muted)] mb-1">INSTRUCTION / DETAILS</label>
          <textarea id="editDescInput" rows="2" placeholder="Domino objectives and constraints..."
            class="w-full px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--text)]">${initial.desc || ''}</textarea>
        </div>
      </div>

      <div class="flex gap-2 pt-2 border-t border-[var(--rule)]">
        <button id="cancelEditBtn" class="flex-1 py-2 text-xs font-bold rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)]">
          CANCEL
        </button>
        <button id="confirmEditBtn" class="flex-1 py-2 text-xs font-bold rounded-[2px] bg-[var(--text)] text-[var(--surface)] hover:opacity-90">
          SAVE SPEC
        </button>
      </div>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(modal);

  const closeModal = () => {
    container.innerHTML = '';
  };

  modal.querySelector('#closeEditModalBtn').addEventListener('click', closeModal);
  modal.querySelector('#cancelEditBtn').addEventListener('click', closeModal);

  modal.querySelector('#confirmEditBtn').addEventListener('click', () => {
    const title = modal.querySelector('#editTitleInput').value.trim();
    if (!title) {
      alert('Domino title is required');
      return;
    }

    const payload = {
      id: initial.id,
      title,
      badge: modal.querySelector('#editBadgeInput').value.trim() || 'DOMINO',
      offset: modal.querySelector('#editOffsetInput').value.trim() || 'Wake + 0:00',
      normalMins: parseInt(modal.querySelector('#editNormalMinsInput').value, 10) || 60,
      emergencyMins: parseInt(modal.querySelector('#editEmergencyMinsInput').value, 10) || 30,
      subtitle: modal.querySelector('#editSubtitleInput').value.trim(),
      desc: modal.querySelector('#editDescInput').value.trim(),
      icon: initial.icon || 'document',
      color: initial.color || 'blue'
    };

    closeModal();
    onSave(payload);
  });
}
