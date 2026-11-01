// src/views/settings.js
import {
  getBlocks,
  saveBlocks,
  getState,
  saveState,
  DEFAULT_BLOCKS,
  isDominoTask,
  getAccentColor,
  setAccentColor,
  resetState
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';

const PALETTE_SWATCHES = [
  { name: 'OLED Pink', hex: '#FF69AF' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Electric Green', hex: '#10B981' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Ultra Violet', hex: '#A855F7' },
  { name: 'Pure White', hex: '#FFFFFF' }
];

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const currentAccent = getAccentColor();

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3.5 pt-2 pb-28 font-sans select-none" aria-label="Configuration Terminal">
      
      <!-- 1. Accent Palette Picker (Reference 1 & Instructions) -->
      <div class="bento-card mb-3.5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-[12px] font-medium text-[#71717A]">Tactile Appearance</div>
            <div class="text-base font-bold text-white tracking-tight">OLED Accent Palette</div>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1A1F] border border-white/10">
            <span class="w-3 h-3 rounded-full" style="background-color: ${currentAccent};"></span>
            <span class="text-xs font-mono font-bold text-white uppercase">${currentAccent}</span>
          </div>
        </div>

        <!-- 6 Glowing Circular Swatches -->
        <div class="flex items-center justify-between gap-2 mb-3 pt-1">
          ${PALETTE_SWATCHES.map(s => {
            const isSelected = s.hex.toLowerCase() === currentAccent.toLowerCase();
            return `
              <button
                data-palette-hex="${s.hex}"
                class="w-10 h-10 rounded-full transition-all btn-tactile relative flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'
                }"
                style="background-color: ${s.hex}; box-shadow: 0 0 12px ${s.hex}60;"
                title="${s.name}"
                aria-label="${s.name}"
              >
                ${isSelected ? `<span class="w-2 h-2 rounded-full ${s.hex === '#FFFFFF' ? 'bg-black' : 'bg-white'}"></span>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Custom Hex Input Field -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <input
            type="text"
            id="accent-custom-hex"
            value="${currentAccent}"
            placeholder="#38BDF8"
            maxlength="7"
            class="flex-1 bg-[#1A1A1F] border border-white/10 text-xs px-3 py-2 font-mono uppercase text-white rounded-full focus:outline-none focus:border-white font-bold"
            aria-label="Custom Hex Code"
          />
          <button
            id="btn-apply-hex"
            class="h-8 px-4 rounded-full bg-white text-black text-xs font-bold uppercase btn-tactile shrink-0"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- 2. Domino Pillar Editor (Clean Bento Rows) -->
      <div class="bento-card mb-3.5">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
          <div>
            <div class="text-[12px] font-medium text-[#71717A]">Pillars & Objectives</div>
            <div class="text-base font-bold text-white tracking-tight">Domino Architecture</div>
          </div>
          <button id="btn-reset-blocks" class="text-xs text-zinc-400 hover:text-white underline">Reset Defaults</button>
        </div>

        <div class="flex flex-col gap-2.5 mb-3.5">
          ${blocks.map((b) => {
            const isMand = isDominoTask(b);
            const targetHrs = (b.targetMins / 60).toFixed(1);
            return `
              <div class="p-3 rounded-2xl bg-[#1A1A1F] border border-white/[0.04] flex flex-col gap-2" data-block-id="${b.id}">
                <!-- Row 1: Badge + Category Pill + Delete -->
                <div class="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    class="w-28 bg-[#121215] border border-white/10 text-xs px-2.5 py-1 font-bold text-white uppercase rounded-full focus:outline-none"
                    placeholder="DOMINO 1"
                  />

                  <div class="flex items-center gap-2">
                    <select
                      data-edit-cat="${b.id}"
                      class="bg-[#121215] border border-white/10 text-xs text-zinc-300 px-2.5 py-1 rounded-full focus:outline-none cursor-pointer"
                    >
                      <option value="STUDY" ${b.category === 'STUDY' ? 'selected' : ''}>STUDY</option>
                      <option value="WORK" ${b.category === 'WORK' ? 'selected' : ''}>WORK</option>
                      <option value="WALK" ${b.category === 'WALK' ? 'selected' : ''}>WALK</option>
                      <option value="OTHER" ${b.category === 'OTHER' ? 'selected' : ''}>OTHER</option>
                    </select>

                    ${blocks.length > 1 ? `
                      <button
                        data-delete-block="${b.id}"
                        class="w-7 h-7 rounded-full bg-red-950/40 border border-red-800/30 text-red-400 hover:bg-red-900 hover:text-white flex items-center justify-center text-xs font-bold btn-tactile"
                        title="Delete Pillar"
                        aria-label="Delete Pillar"
                      >
                        ✕
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Row 2: Title Input -->
                <div>
                  <input
                    type="text"
                    data-edit-name="${b.id}"
                    value="${b.name}"
                    class="w-full bg-transparent text-sm text-white font-bold tracking-tight focus:outline-none placeholder-zinc-500"
                    placeholder="Pillar Name"
                  />
                </div>

                <!-- Row 3: Target Hours Steppers (-0.5h / +0.5h) -->
                <div class="flex items-center justify-between pt-1 text-xs border-t border-white/[0.04]">
                  <span class="text-zinc-500 font-medium">Daily Target Floor</span>
                  <div class="flex items-center gap-2">
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="-30"
                      class="w-7 h-7 rounded-full bg-[#121215] border border-white/10 text-white font-bold flex items-center justify-center btn-tactile"
                      aria-label="Decrease Target 30m"
                    >
                      -
                    </button>
                    <span class="font-mono font-bold text-white text-xs w-10 text-center">${targetHrs}h</span>
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="30"
                      class="w-7 h-7 rounded-full bg-[#121215] border border-white/10 text-white font-bold flex items-center justify-center btn-tactile"
                      aria-label="Increase Target 30m"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button
          id="btn-add-pillar"
          class="w-full h-11 rounded-full border border-dashed border-white/20 hover:border-white/40 bg-[#1A1A1F]/60 text-zinc-300 hover:text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 btn-tactile"
        >
          <span>+ Add New Domino Pillar</span>
        </button>
      </div>

      <!-- 3. Streak Shields Bank -->
      <div class="bento-card mb-3.5 flex items-center justify-between">
        <div>
          <div class="text-[12px] font-medium text-[#71717A]">Gamification Guard</div>
          <div class="text-sm font-bold text-white">Streak Shields (🛡️)</div>
          <div class="text-[11px] text-zinc-500 mt-0.5">${state.shields || 0} of 3 active (+1 every 7-day streak)</div>
        </div>
        <button
          id="btn-add-shield"
          class="px-4 py-2 rounded-full bg-white text-black text-xs font-bold btn-tactile shadow-md"
        >
          +1 Shield
        </button>
      </div>

      <!-- 4. Backup & Factory Reset -->
      <div class="bento-card mb-3.5">
        <div class="text-[12px] font-medium text-[#71717A] mb-1">Data Portability</div>
        <div class="text-sm font-bold text-white mb-3">Backup & Storage</div>

        <div class="grid grid-cols-2 gap-2 mb-2">
          <button
            id="btn-backup-json"
            class="h-10 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1 btn-tactile"
          >
            <span>↓</span>
            <span>Export JSON</span>
          </button>
          <label class="h-10 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer btn-tactile">
            <span>↑</span>
            <span>Import JSON</span>
            <input type="file" id="file-import-json" accept=".json" class="hidden" />
          </label>
        </div>

        <button
          id="btn-factory-reset"
          class="w-full h-10 mt-2 rounded-full bg-red-950/30 border border-red-800/40 text-red-400 hover:bg-red-900/40 hover:text-red-300 text-xs font-bold uppercase btn-tactile"
        >
          ⚠ Factory Reset All Data
        </button>
      </div>
    </section>
  `;

  bindSettingsEvents(container);
}

export function renderSettings(container) {
  renderSettingsView(container);
}

function bindSettingsEvents(container) {
  // Swatch Click
  container.querySelectorAll('[data-palette-hex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.getAttribute('data-palette-hex');
      setAccentColor(hex);
      playRelayClick();
      renderSettingsView(container);
    });
  });

  // Custom Hex Input Apply
  container.querySelector('#btn-apply-hex')?.addEventListener('click', () => {
    let val = container.querySelector('#accent-custom-hex')?.value?.trim();
    if (val) {
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
        setAccentColor(val);
        playRelayClick();
        renderSettingsView(container);
      }
    }
  });

  // +1 Shield
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

  // Add New Domino Pillar
  container.querySelector('#btn-add-pillar')?.addEventListener('click', () => {
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
  });

  // Delete Domino Pillar
  container.querySelectorAll('[data-delete-block]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-block');
      const blocks = getBlocks();
      if (blocks.length <= 1) return;
      const updated = blocks.filter(b => b.id !== id);
      saveBlocks(updated);
      playRelayClick();
      renderSettingsView(container);
    });
  });

  // Target Hour Steppers (-0.5h / +0.5h)
  container.querySelectorAll('[data-step-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-step-target');
      const delta = Number(btn.getAttribute('data-step-delta'));
      const blocks = getBlocks();
      const b = blocks.find(x => x.id === id);
      if (b) {
        b.targetMins = Math.max(15, Math.min(720, b.targetMins + delta));
        saveBlocks(blocks);
        playRelayClick();
        renderSettingsView(container);
      }
    });
  });

  // Live auto-save on badge, name, or category change
  container.querySelectorAll('[data-block-id]').forEach(wrapper => {
    const id = wrapper.getAttribute('data-block-id');
    const badgeInput = wrapper.querySelector(`[data-edit-badge="${id}"]`);
    const nameInput = wrapper.querySelector(`[data-edit-name="${id}"]`);
    const catSelect = wrapper.querySelector(`[data-edit-cat="${id}"]`);

    const updateBlock = () => {
      const blocks = getBlocks();
      const b = blocks.find(x => x.id === id);
      if (b) {
        b.badge = badgeInput?.value.trim() || 'DOMINO';
        b.name = nameInput?.value.trim() || 'Custom Task';
        b.category = catSelect?.value || 'STUDY';
        saveBlocks(blocks);
      }
    };

    badgeInput?.addEventListener('change', updateBlock);
    nameInput?.addEventListener('change', updateBlock);
    catSelect?.addEventListener('change', updateBlock);
  });

  // Export JSON
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
  });

  // Import JSON
  container.querySelector('#file-import-json')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.state) saveState(imported.state);
        if (imported.blocks && Array.isArray(imported.blocks)) saveBlocks(imported.blocks);
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
