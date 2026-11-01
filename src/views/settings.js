// src/views/settings.js
import {
  getBlocks,
  saveBlocks,
  getState,
  saveState,
  DEFAULT_BLOCKS,
  isDominoTask,
  THEMES,
  getTheme,
  setTheme
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { showInAppToast } from '../components/header.js';

let activeDateStr = new Date().toISOString().slice(0, 10);

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const todayRec = state.records?.[activeDateStr] || { emergency: false };
  const isEmergency = todayRec.emergency || false;
  const currentThemeId = getTheme();

  // Apply or remove global emergency theme shift
  if (isEmergency) {
    document.documentElement.classList.add('emergency-mode');
  } else {
    document.documentElement.classList.remove('emergency-mode');
  }

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3 pt-2 pb-24 font-mono select-none" aria-label="Settings Terminal">
      <!-- 3-Theme Switcher Card -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">INTERFACE THEME (3 MODES)</div>
        <div class="grid grid-cols-3 gap-1.5">
          ${THEMES.map(t => {
            const isSelected = t.id === currentThemeId;
            return `
              <button
                data-theme-choice="${t.id}"
                class="btn-tactile h-11 border-2 ${
                  isSelected
                    ? 'border-[#FF69AF] bg-[#FF69AF] text-black font-extrabold'
                    : 'border-neutral-800 bg-[#0c0c0c] text-neutral-300'
                } flex flex-col items-center justify-center text-[10px] leading-tight"
              >
                <span>${t.label}</span>
                <span class="text-[8px] opacity-75">${t.id === 'cyber' ? 'OLED Pill' : t.id === 'brutalist' ? 'Raw Wire' : 'Monochrome'}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Emergency Mode Toggle Card -->
      <div class="card-shell border-2 ${isEmergency ? 'border-red-600 bg-[#120404]' : 'border-neutral-800 bg-[#0a0a0a]'} p-3 mb-3">
        <div class="flex items-center justify-between mb-2">
          <div class="pr-2">
            <div class="text-xs font-bold ${isEmergency ? 'text-red-400' : 'text-white'}">EMERGENCY MODE (STREAK SAVER)</div>
            <div class="text-[10px] text-neutral-400 leading-tight mt-0.5">Halts target floors by 50% for crisis days. Cannot be used 2 days in a row.</div>
          </div>
          <button
            id="btn-toggle-emergency"
            class="btn-tactile px-3.5 py-2 border shrink-0 ${isEmergency ? 'border-red-500 bg-red-500 text-black font-bold text-xs' : 'border-neutral-700 bg-black text-white text-xs'}"
          >
            ${isEmergency ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      <!-- Streak Shield Bank -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">STREAK SHIELDS (🛡️)</div>
            <div class="text-[10px] text-neutral-400">Current Shields: ${state.shields || 0} / 3 (+1 every 7-day streak)</div>
          </div>
          <button id="btn-add-shield" class="btn-tactile px-3 py-1.5 border border-white text-xs font-bold text-white active:bg-white active:text-black">
            +1 SHIELD
          </button>
        </div>
      </div>

      <!-- Domino Pillars & Badge Editor -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800">
          <div class="text-xs font-bold text-white uppercase">DOMINO PILLARS & BADGES</div>
          <button id="btn-reset-blocks" class="text-[10px] text-neutral-400 underline">Reset Defaults</button>
        </div>

        <div class="flex flex-col gap-2.5">
          ${blocks.map((b) => {
            const isMand = isDominoTask(b);
            return `
              <div class="border border-neutral-800 bg-black/60 rounded p-2.5" data-block-id="${b.id}">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    class="w-28 bg-[#121212] border ${isMand ? 'border-[#FF69AF] text-[#FF69AF]' : 'border-neutral-700 text-white'} text-[11px] px-2 py-1 font-bold uppercase rounded focus:outline-none"
                    placeholder="Badge"
                  />
                  <select
                    data-edit-cat="${b.id}"
                    class="bg-[#121212] border border-neutral-700 text-[11px] text-white px-2 py-1 rounded focus:outline-none"
                  >
                    <option value="STUDY" ${b.category === 'STUDY' ? 'selected' : ''}>STUDY</option>
                    <option value="WORK" ${b.category === 'WORK' ? 'selected' : ''}>WORK</option>
                    <option value="WALK" ${b.category === 'WALK' ? 'selected' : ''}>WALK</option>
                    <option value="REST" ${b.category === 'REST' ? 'selected' : ''}>REST</option>
                  </select>
                </div>

                <div class="mb-2">
                  <input
                    type="text"
                    data-edit-name="${b.id}"
                    value="${b.name}"
                    class="w-full bg-[#121212] border border-neutral-700 text-xs text-white px-2 py-1.5 rounded focus:outline-none font-bold"
                    placeholder="Block Name"
                  />
                </div>

                <div class="flex items-center justify-between text-[11px] text-neutral-400">
                  <div class="flex items-center gap-1.5">
                    <span>Floor (Hrs):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      data-edit-target="${b.id}"
                      value="${(b.targetMins / 60).toFixed(1)}"
                      class="w-16 bg-[#121212] border border-neutral-700 text-white text-center py-0.5 rounded focus:outline-none font-mono"
                    />
                  </div>
                  <span class="${isMand ? 'text-[#FF69AF] font-bold' : 'text-neutral-500'}">
                    ${isMand ? '[MANDATORY DOMINO]' : '[ROUTINE]'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- State Backup & JSON Restore Controls -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="text-xs font-bold text-white uppercase mb-2">STATE BACKUP & RESTORE</div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button id="btn-backup-json" class="btn-tactile h-11 border border-white bg-black text-xs font-bold uppercase text-white active:bg-white active:text-black">
            EXPORT JSON
          </button>
          <label class="btn-tactile h-11 border border-neutral-700 bg-black text-xs font-bold uppercase flex items-center justify-center cursor-pointer hover:border-white text-white">
            IMPORT JSON
            <input type="file" id="file-import-json" accept=".json" class="hidden" />
          </label>
        </div>
        <div class="text-[10px] text-neutral-500 leading-tight">
          All records persist locally. Importing a backup replaces current browser storage.
        </div>
      </div>

      <!-- Factory Reset -->
      <button id="btn-factory-reset" class="btn-tactile w-full h-11 border border-red-800 bg-black text-red-400 text-xs uppercase tracking-widest active:bg-red-900 active:text-white">
        ⚠ FACTORY RESET ALL DATA
      </button>
    </section>
  `;

  bindSettingsEvents(container);
}

export function renderSettings(container) {
  renderSettingsView(container);
}

function bindSettingsEvents(container) {
  // Theme Choices
  container.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-theme-choice');
      setTheme(choice);
      showInAppToast(`Theme set to ${choice.toUpperCase()}`);
      renderSettingsView(container);
    });
  });

  // Toggle Emergency Mode with 2-consecutive-day rule
  container.querySelector('#btn-toggle-emergency')?.addEventListener('click', () => {
    const state = getState();
    if (!state.records[activeDateStr]) {
      state.records[activeDateStr] = { durations: {}, completed: [], logs: [], emergency: false };
    }
    const currentEmergency = !!state.records[activeDateStr].emergency;

    if (!currentEmergency) {
      const yesterday = new Date(activeDateStr + 'T00:00:00');
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (state.records[yesterdayStr]?.emergency) {
        playRelayClick();
        showInAppToast('RULE: Emergency Mode cannot be active 2 consecutive days!', true);
        return;
      }
    }

    state.records[activeDateStr].emergency = !currentEmergency;
    saveState(state);
    playRelayClick();
    renderSettingsView(container);
    showInAppToast(state.records[activeDateStr].emergency ? 'EMERGENCY MODE ACTIVATED (-50% Floors)' : 'Emergency Mode Deactivated');
  });

  // Add Shield
  container.querySelector('#btn-add-shield')?.addEventListener('click', () => {
    const state = getState();
    state.shields = Math.min(3, (state.shields || 0) + 1);
    saveState(state);
    playRelayClick();
    renderSettingsView(container);
    showInAppToast(`Shield Added (${state.shields}/3)`);
  });

  // Reset Blocks to Default
  container.querySelector('#btn-reset-blocks')?.addEventListener('click', () => {
    if (confirm('Reset all Domino pillars and targets to factory defaults?')) {
      saveBlocks(structuredClone(DEFAULT_BLOCKS));
      playRelayClick();
      renderSettingsView(container);
      showInAppToast('Domino pillars reset to default');
    }
  });

  // Live auto-save on block input changes
  container.querySelectorAll('[data-block-id]').forEach(wrapper => {
    const id = wrapper.getAttribute('data-block-id');
    const badgeInput = wrapper.querySelector(`[data-edit-badge="${id}"]`);
    const nameInput = wrapper.querySelector(`[data-edit-name="${id}"]`);
    const catSelect = wrapper.querySelector(`[data-edit-cat="${id}"]`);
    const targetInput = wrapper.querySelector(`[data-edit-target="${id}"]`);

    const updateBlock = () => {
      const blocks = getBlocks();
      const b = blocks.find(x => x.id === id);
      if (b) {
        b.badge = badgeInput.value.trim() || 'DOMINO';
        b.name = nameInput.value.trim() || 'Unnamed Block';
        b.category = catSelect.value;
        const hrs = parseFloat(targetInput.value);
        if (!isNaN(hrs) && hrs > 0) {
          b.targetMins = Math.round(hrs * 60);
        }
        saveBlocks(blocks);
      }
    };

    badgeInput?.addEventListener('input', updateBlock);
    nameInput?.addEventListener('input', updateBlock);
    catSelect?.addEventListener('change', updateBlock);
    targetInput?.addEventListener('input', updateBlock);
  });

  // Export JSON Backup
  container.querySelector('#btn-backup-json')?.addEventListener('click', () => {
    playRelayClick();
    const fullBackup = {
      state: getState(),
      blocks: getBlocks(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceed-domino-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showInAppToast('JSON Backup Created');
  });

  // Import JSON Restore
  container.querySelector('#file-import-json')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.state) localStorage.setItem('ceed_v2_state', JSON.stringify(parsed.state));
        if (parsed.blocks) localStorage.setItem('ceed_v2_blocks', JSON.stringify(parsed.blocks));
        playRelayClick();
        showInAppToast('Backup successfully restored!');
        renderSettingsView(container);
      } catch (err) {
        showInAppToast('Invalid JSON backup file.', true);
      }
    };
    reader.readAsText(file);
  });

  // Factory Reset
  container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
    if (confirm('WARNING: This will wipe all local progress, logs, and streak history. Are you absolutely sure?')) {
      localStorage.clear();
      playRelayClick();
      window.location.hash = '#/';
      window.location.reload();
    }
  });
}
