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
  setTheme,
  getAccentColor,
  setAccentColor,
  resetState
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { showInAppToast } from '../components/header.js';

const PRESET_COLORS = [
  { name: 'OLED Pink', hex: '#FF69AF' },
  { name: 'Cyber Cyan', hex: '#00E5FF' },
  { name: 'Electric Green', hex: '#10B981' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Ultra Violet', hex: '#8B5CF6' },
  { name: 'Pure White', hex: '#FFFFFF' }
];

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const currentThemeId = getTheme();
  const currentAccent = getAccentColor();

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
                    ? 'border-white bg-white text-black font-extrabold'
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

      <!-- Custom Accent Color Chooser -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between mb-2">
          <div class="text-[10px] uppercase tracking-wider text-neutral-400">CUSTOM ACCENT COLOR</div>
          <div class="flex items-center gap-1.5">
            <div id="accent-preview-box" class="w-4 h-4 rounded-full border border-white" style="background-color: ${currentAccent}; box-shadow: 0 0 8px ${currentAccent};"></div>
            <span id="accent-hex-display" class="text-xs font-bold text-white">${currentAccent}</span>
          </div>
        </div>

        <!-- Custom Color Inputs -->
        <div class="flex items-center gap-2 mb-3">
          <input
            type="color"
            id="accent-color-picker"
            value="${currentAccent}"
            class="w-10 h-10 border-2 border-neutral-700 bg-black cursor-pointer rounded shrink-0 p-0"
            aria-label="Pick Accent Color"
          />
          <input
            type="text"
            id="accent-hex-input"
            value="${currentAccent}"
            placeholder="#FF69AF"
            maxlength="7"
            class="flex-1 bg-[#121212] border border-neutral-700 text-xs px-2.5 py-2 font-mono uppercase text-white rounded focus:outline-none focus:border-white font-bold"
            aria-label="Enter Hex Color Code"
          />
          <button
            id="btn-apply-hex"
            class="btn-tactile h-9 px-3 border border-white bg-white text-black text-xs font-bold uppercase shrink-0"
          >
            APPLY
          </button>
        </div>

        <!-- Quick OLED Neon Presets -->
        <div class="grid grid-cols-3 gap-1.5">
          ${PRESET_COLORS.map(p => `
            <button
              data-preset-hex="${p.hex}"
              class="btn-tactile h-8 px-2 border ${p.hex.toLowerCase() === currentAccent.toLowerCase() ? 'border-white' : 'border-neutral-800'} bg-[#121212] flex items-center gap-1.5 rounded"
            >
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${p.hex};"></span>
              <span class="text-[9px] font-bold text-neutral-200 truncate">${p.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Fully Customizable Domino Pillars & Badges -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800">
          <div>
            <div class="text-xs font-bold text-white uppercase">CUSTOMIZE DOMINO PILLARS</div>
            <div class="text-[9px] text-neutral-400">Include "DOMINO" in badge for streak tracking</div>
          </div>
          <button id="btn-reset-blocks" class="text-[10px] text-neutral-400 hover:text-white underline">Reset Defaults</button>
        </div>

        <div class="flex flex-col gap-2.5 mb-3" id="domino-editor-list">
          ${blocks.map((b, idx) => {
            const isMand = isDominoTask(b);
            return `
              <div class="border border-neutral-800 bg-black/60 rounded p-2.5 relative" data-block-id="${b.id}">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    class="w-32 bg-[#121212] border ${isMand ? 'border-neutral-500 text-white' : 'border-neutral-800 text-neutral-400'} text-[11px] px-2 py-1 font-bold uppercase rounded focus:outline-none"
                    placeholder="Badge (e.g. DOMINO 1)"
                  />

                  <div class="flex items-center gap-1.5">
                    <select
                      data-edit-cat="${b.id}"
                      class="bg-[#121212] border border-neutral-700 text-[11px] text-white px-2 py-1 rounded focus:outline-none"
                    >
                      <option value="STUDY" ${b.category === 'STUDY' ? 'selected' : ''}>STUDY</option>
                      <option value="WORK" ${b.category === 'WORK' ? 'selected' : ''}>WORK</option>
                      <option value="WALK" ${b.category === 'WALK' ? 'selected' : ''}>WALK</option>
                      <option value="REST" ${b.category === 'REST' ? 'selected' : ''}>REST</option>
                      <option value="OTHER" ${b.category === 'OTHER' ? 'selected' : ''}>OTHER</option>
                    </select>

                    ${blocks.length > 1 ? `
                      <button
                        data-delete-block="${b.id}"
                        class="btn-tactile w-7 h-7 border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900 hover:text-white rounded flex items-center justify-center text-xs font-bold"
                        title="Delete Domino"
                        aria-label="Delete Domino"
                      >
                        ✕
                      </button>
                    ` : ''}
                  </div>
                </div>

                <div class="mb-2">
                  <input
                    type="text"
                    data-edit-name="${b.id}"
                    value="${b.name}"
                    class="w-full bg-[#121212] border border-neutral-700 text-xs text-white px-2 py-1.5 rounded focus:outline-none font-bold"
                    placeholder="Pillar Name (e.g. Study & Sketching)"
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
                  <span class="${isMand ? 'text-white font-bold' : 'text-neutral-500'}">
                    ${isMand ? '[MANDATORY DOMINO]' : '[FLEXIBLE ROUTINE]'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button
          id="btn-add-new-block"
          class="btn-tactile w-full h-10 border-2 border-dashed border-neutral-700 hover:border-white bg-[#0c0c0c] text-neutral-300 hover:text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 rounded"
        >
          <span>+ ADD NEW DOMINO PILLAR</span>
        </button>
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

  // Color Picker & Hex Apply
  const colorPicker = container.querySelector('#accent-color-picker');
  const hexInput = container.querySelector('#accent-hex-input');
  const btnApplyHex = container.querySelector('#btn-apply-hex');

  const updateColor = (hex) => {
    if (!hex) return;
    const clean = setAccentColor(hex);
    playRelayClick();
    showInAppToast(`Accent Color Set: ${clean}`);
    renderSettingsView(container);
  };

  colorPicker?.addEventListener('input', (e) => {
    if (hexInput) hexInput.value = e.target.value.toUpperCase();
  });

  colorPicker?.addEventListener('change', (e) => {
    updateColor(e.target.value);
  });

  btnApplyHex?.addEventListener('click', () => {
    let val = hexInput?.value?.trim();
    if (val) {
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
        updateColor(val);
      } else {
        showInAppToast('Invalid Hex color! e.g. #00E5FF');
      }
    }
  });

  // Preset Color Buttons
  container.querySelectorAll('[data-preset-hex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.getAttribute('data-preset-hex');
      updateColor(hex);
    });
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

  // Add New Domino Pillar
  container.querySelector('#btn-add-new-block')?.addEventListener('click', () => {
    const blocks = getBlocks();
    const newIdx = blocks.length + 1;
    const newBlock = {
      id: `domino_${Date.now()}`,
      badge: `DOMINO ${newIdx}`,
      name: `Custom Pillar ${newIdx}`,
      category: 'STUDY',
      targetMins: 60
    };
    blocks.push(newBlock);
    saveBlocks(blocks);
    playRelayClick();
    renderSettingsView(container);
    showInAppToast(`Added ${newBlock.badge}!`);
  });

  // Delete Domino Pillar
  container.querySelectorAll('[data-delete-block]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-block');
      const blocks = getBlocks();
      if (blocks.length <= 1) {
        showInAppToast('Cannot delete the last remaining Domino!');
        return;
      }
      const updated = blocks.filter(b => b.id !== id);
      saveBlocks(updated);
      playRelayClick();
      renderSettingsView(container);
      showInAppToast('Domino deleted');
    });
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
        b.badge = badgeInput?.value.trim() || 'DOMINO';
        b.name = nameInput?.value.trim() || 'Custom Task';
        b.category = catSelect?.value || 'STUDY';
        const hours = parseFloat(targetInput?.value) || 1.0;
        b.targetMins = Math.max(15, Math.round(hours * 60));
        saveBlocks(blocks);
      }
    };

    badgeInput?.addEventListener('change', updateBlock);
    nameInput?.addEventListener('change', updateBlock);
    catSelect?.addEventListener('change', updateBlock);
    targetInput?.addEventListener('change', updateBlock);
  });

  // Backup JSON
  container.querySelector('#btn-backup-json')?.addEventListener('click', () => {
    const state = getState();
    const blocks = getBlocks();
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      state,
      blocks
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceed_domino_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playRelayClick();
    showInAppToast('JSON Backup Downloaded');
  });

  // Import JSON
  container.querySelector('#file-import-json')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.state) {
          saveState(imported.state);
        }
        if (imported.blocks && Array.isArray(imported.blocks)) {
          saveBlocks(imported.blocks);
        }
        playRelayClick();
        alert('Backup successfully restored!');
        window.location.reload();
      } catch (err) {
        alert('Invalid JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Factory Reset
  container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
    if (confirm('DANGER: This will permanently erase ALL logs, streaks, and custom settings. Continue?')) {
      resetState();
      saveBlocks(structuredClone(DEFAULT_BLOCKS));
      window.location.reload();
    }
  });
}
