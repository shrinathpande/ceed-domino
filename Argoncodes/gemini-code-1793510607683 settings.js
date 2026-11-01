// src/views/settings.js
import {
  getBlocks,
  saveBlocks,
  getState,
  saveState,
  DEFAULT_BLOCKS,
  isDominoTask
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';

let activeDateStr = new Date().toISOString().slice(0, 10);

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const todayRec = state.records?.[activeDateStr] || { emergency: false };
  const isEmergency = todayRec.emergency || false;

  container.innerHTML = `
    <section class="w-full max-w-[390px] mx-auto px-3 pt-2 pb-24 font-mono text-white select-none">
      <!-- Settings Terminal Header -->
      <div class="border-2 border-white bg-[#0a0a0a] p-3 mb-3">
        <div class="text-xs uppercase tracking-wider text-neutral-400 mb-1">SYSTEM TERMINAL // CONFIG</div>
        <div class="text-sm font-bold text-white">CEED DOMINO v2.0 CONFIGURATION</div>
      </div>

      <!-- Emergency Mode Toggle Card -->
      <div class="border-2 ${isEmergency ? 'border-red-600 bg-[#120404]' : 'border-neutral-800 bg-[#0a0a0a]'} p-3 mb-3">
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="text-xs font-bold ${isEmergency ? 'text-red-400' : 'text-white'}">EMERGENCY MODE (STREAK SAVER)</div>
            <div class="text-[10px] text-neutral-400">Halts target floors by 50% for crisis days. Cannot be used 2 days in a row.</div>
          </div>
          <button
            id="btn-toggle-emergency"
            class="px-3 py-1.5 border ${isEmergency ? 'border-red-500 bg-red-500 text-black font-bold text-xs' : 'border-neutral-700 bg-black text-white text-xs'}"
          >
            ${isEmergency ? 'ACTIVE (RED)' : 'OFF'}
          </button>
        </div>
      </div>

      <!-- Streak Shield Bank -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">STREAK SHIELDS (🛡️)</div>
            <div class="text-[10px] text-neutral-400">Current Shields: ${state.shields || 0} / 3 (+1 every 7-day streak)</div>
          </div>
          <button id="btn-add-shield" class="px-3 py-1.5 border border-white text-xs font-bold active:bg-white active:text-black">
            +1 SHIELD
          </button>
        </div>
      </div>

      <!-- Domino Pillars & Badge Editor -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800">
          <div class="text-xs font-bold text-white uppercase">DOMINO PILLARS & BADGES</div>
          <button id="btn-reset-blocks" class="text-[10px] text-neutral-400 underline">Reset Defaults</button>
        </div>

        <div class="flex flex-col gap-3">
          ${blocks.map((b, idx) => {
            const isMand = isDominoTask(b);
            return `
              <div class="border border-neutral-800 bg-black p-2.5" data-block-id="${b.id}">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    class="w-28 bg-neutral-900 border ${isMand ? 'border-[#FF69AF] text-[#FF69AF]' : 'border-neutral-700 text-white'} text-[11px] px-2 py-1 font-bold uppercase focus:outline-none"
                    placeholder="Badge (e.g. DOMINO 1)"
                  />
                  <select
                    data-edit-cat="${b.id}"
                    class="bg-neutral-900 border border-neutral-700 text-[11px] text-white px-2 py-1 focus:outline-none"
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
                    class="w-full bg-neutral-900 border border-neutral-700 text-xs text-white px-2 py-1 focus:outline-none font-bold"
                    placeholder="Block Name"
                  />
                </div>

                <div class="flex items-center justify-between text-[11px] text-neutral-400">
                  <div class="flex items-center gap-1.5">
                    <span>Target Target (Hrs):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      data-edit-target="${b.id}"
                      value="${(b.targetMins / 60).toFixed(1)}"
                      class="w-16 bg-neutral-900 border border-neutral-700 text-white text-center py-0.5 focus:outline-none"
                    />
                  </div>
                  <span class="${isMand ? 'text-[#FF69AF]' : 'text-neutral-500'}">
                    ${isMand ? '[MANDATORY DOMINO]' : '[ROUTINE]'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- State Backup & JSON Restore Controls -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="text-xs font-bold text-white uppercase mb-2">STATE BACKUP & RESTORE</div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button id="btn-backup-json" class="h-11 border border-white bg-black text-xs font-bold uppercase active:bg-white active:text-black">
            EXPORT JSON
          </button>
          <label class="h-11 border border-neutral-700 bg-black text-xs font-bold uppercase flex items-center justify-center cursor-pointer hover:border-white">
            IMPORT JSON
            <input type="file" id="file-import-json" accept=".json" class="hidden" />
          </label>
        </div>
        <div class="text-[10px] text-neutral-500 leading-tight">
          All records persist locally. Importing a backup replaces current browser storage.
        </div>
      </div>

      <!-- Factory Reset -->
      <button id="btn-factory-reset" class="w-full h-11 border border-red-800 bg-black text-red-400 text-xs uppercase tracking-widest active:bg-red-900 active:text-white">
        ⚠ FACTORY RESET ALL DATA
      </button>
    </section>
  `;

  bindSettingsEvents(container);
}

function bindSettingsEvents(container) {
  // Toggle Emergency Mode
  container.querySelector('#btn-toggle-emergency')?.addEventListener('click', () => {
    const state = getState();
    if (!state.records[activeDateStr]) {
      state.records[activeDateStr] = { durations: {}, completed: [], logs: [], emergency: false };
    }
    state.records[activeDateStr].emergency = !state.records[activeDateStr].emergency;
    saveState(state);
    playRelayClick();
    renderSettingsView(container);
  });

  // Add Shield
  container.querySelector('#btn-add-shield')?.addEventListener('click', () => {
    const state = getState();
    state.shields = Math.min(3, (state.shields || 0) + 1);
    saveState(state);
    playRelayClick();
    renderSettingsView(container);
  });

  // Reset Blocks to Default
  container.querySelector('#btn-reset-blocks')?.addEventListener('click', () => {
    if (confirm('Reset all Domino pillars and targets to factory defaults?')) {
      saveBlocks(structuredClone(DEFAULT_BLOCKS));
      playRelayClick();
      renderSettingsView(container);
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
        alert('Backup successfully restored from JSON!');
        renderSettingsView(container);
      } catch (err) {
        alert('Invalid JSON backup file.');
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