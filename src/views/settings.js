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
import { icons } from '../components/icons.js';

// The 6 Flat Soft Pastel Swatches (Zero Neons, Zero Glow)
const PASTEL_SWATCHES = [
  { name: 'Soft Blush Rose', hex: '#FBCFE8' },
  { name: 'Soft Periwinkle', hex: '#A5C4FF' },
  { name: 'Soft Sage Mint', hex: '#A7F3D0' },
  { name: 'Soft Peach Butter', hex: '#FDE6B8' },
  { name: 'Soft Lavender', hex: '#C4B5FD' },
  { name: 'Crisp Chalk White', hex: '#F4F4F6' }
];

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const currentAccent = getAccentColor();

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-4 pt-2 pb-28 font-sans select-none" aria-label="Configuration Terminal">
      
      <!-- 1. Curated Soft Pastel Swatches (Zero Glow, Zero Toast Spam) -->
      <div class="bento-card mb-3.5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-[12px] font-medium text-[#71717A]">Tactile Appearance</div>
            <div class="text-base font-bold text-[#F4F4F6] tracking-tight">Soft Pastel Palette</div>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18181B] border border-[#27272A]">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${currentAccent};"></span>
            <span class="text-xs font-mono font-medium text-[#F4F4F6] uppercase">${currentAccent}</span>
          </div>
        </div>

        <!-- 6 Flat Circular Swatches -->
        <div class="flex items-center justify-between gap-2 pt-1">
          ${PASTEL_SWATCHES.map(s => {
            const isSelected = s.hex.toLowerCase() === currentAccent.toLowerCase();
            return `
              <button
                data-pastel-hex="${s.hex}"
                class="w-10 h-10 rounded-full transition-all btn-tactile relative flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : 'hover:opacity-90'
                }"
                style="background-color: ${s.hex}; border: 1px solid rgba(0,0,0,0.1);"
                title="${s.name}"
                aria-label="${s.name}"
              >
                ${isSelected ? `<span class="w-2 h-2 rounded-full ${s.hex === '#F4F4F6' ? 'bg-black' : 'bg-[#09090B]'}"></span>` : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 2. Domino Pillar Editor (Clean Bento Rows) -->
      <div class="bento-card mb-3.5">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#1F1F23]">
          <div>
            <div class="text-[12px] font-medium text-[#71717A]">Pillars & Objectives</div>
            <div class="text-base font-bold text-[#F4F4F6] tracking-tight">Domino Architecture</div>
          </div>
          <button id="btn-reset-blocks" class="text-xs text-[#71717A] hover:text-[#F4F4F6] underline">Reset Defaults</button>
        </div>

        <div class="flex flex-col gap-2.5 mb-3.5">
          ${blocks.map((b) => {
            const targetHrs = (b.targetMins / 60).toFixed(1);
            return `
              <div class="p-3.5 rounded-2xl bg-[#18181B] border border-[#27272A] flex flex-col gap-2" data-block-id="${b.id}">
                <!-- Row 1: Badge + Category Pill + Delete -->
                <div class="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    class="w-28 bg-[#121214] border border-[#27272A] text-xs px-2.5 py-1 font-semibold text-[#F4F4F6] uppercase rounded-full focus:outline-none"
                    placeholder="DOMINO 1"
                  />

                  <div class="flex items-center gap-2">
                    <select
                      data-edit-cat="${b.id}"
                      class="bg-[#121214] border border-[#27272A] text-xs text-[#A1A1AA] px-2.5 py-1 rounded-full focus:outline-none cursor-pointer"
                    >
                      <option value="STUDY" ${b.category === 'STUDY' ? 'selected' : ''}>STUDY</option>
                      <option value="WORK" ${b.category === 'WORK' ? 'selected' : ''}>WORK</option>
                      <option value="WALK" ${b.category === 'WALK' ? 'selected' : ''}>WALK</option>
                      <option value="OTHER" ${b.category === 'OTHER' ? 'selected' : ''}>OTHER</option>
                    </select>

                    ${blocks.length > 1 ? `
                      <button
                        data-delete-block="${b.id}"
                        class="w-7 h-7 rounded-full bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white flex items-center justify-center text-xs font-bold btn-tactile"
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
                    class="w-full bg-transparent text-sm text-[#F4F4F6] font-medium tracking-tight focus:outline-none placeholder-zinc-500"
                    placeholder="Pillar Name"
                  />
                </div>

                <!-- Row 3: Target Hours Steppers (-0.5h / +0.5h) -->
                <div class="flex items-center justify-between pt-1 text-xs border-t border-[#27272A]">
                  <span class="text-[#71717A] font-medium">Daily Target Floor</span>
                  <div class="flex items-center gap-2">
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="-30"
                      class="w-7 h-7 rounded-full bg-[#121214] border border-[#27272A] text-[#F4F4F6] font-bold flex items-center justify-center btn-tactile text-sm"
                      aria-label="Decrease Target 30m"
                    >
                      -
                    </button>
                    <span class="font-mono font-semibold text-[#F4F4F6] text-xs w-10 text-center">${targetHrs}h</span>
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="30"
                      class="w-7 h-7 rounded-full bg-[#121214] border border-[#27272A] text-[#F4F4F6] font-bold flex items-center justify-center btn-tactile text-sm"
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
          class="w-full h-11 rounded-full border border-dashed border-[#27272A] hover:border-[#3F3F46] bg-[#18181B] text-[#A1A1AA] hover:text-[#F4F4F6] text-xs font-semibold uppercase flex items-center justify-center gap-1.5 btn-tactile"
        >
          <span>+ Add New Domino Pillar</span>
        </button>
      </div>

      <!-- 3. Streak Shields Bank -->
      <div class="bento-card mb-3.5 flex items-center justify-between">
        <div>
          <div class="text-[12px] font-medium text-[#71717A]">Gamification Guard</div>
          <div class="text-sm font-semibold text-[#F4F4F6]">Streak Shields</div>
          <div class="text-[11px] text-[#71717A] mt-0.5">${state.shields || 0} of 3 active (+1 every 7-day streak)</div>
        </div>
        <button
          id="btn-add-shield"
          class="px-4 py-2 rounded-full bg-[#F4F4F6] text-[#09090B] text-xs font-semibold btn-tactile"
        >
          +1 Shield
        </button>
      </div>

      <!-- 4. Backup & Factory Reset -->
      <div class="bento-card mb-3.5">
        <div class="text-[12px] font-medium text-[#71717A] mb-1">Data Portability</div>
        <div class="text-sm font-semibold text-[#F4F4F6] mb-3">Backup & Storage</div>

        <div class="grid grid-cols-2 gap-2.5 mb-2">
          <button
            id="btn-backup-json"
            class="h-10 rounded-full bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#F4F4F6] flex items-center justify-center gap-1.5 btn-tactile"
          >
            <span>↓</span>
            <span>Export JSON</span>
          </button>
          <label class="h-10 rounded-full bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#F4F4F6] flex items-center justify-center gap-1.5 cursor-pointer btn-tactile">
            <span>↑</span>
            <span>Import JSON</span>
            <input type="file" id="file-import-json" accept=".json" class="hidden" />
          </label>
        </div>

        <button
          id="btn-factory-reset"
          class="w-full h-10 mt-2 rounded-full bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 text-xs font-semibold uppercase btn-tactile"
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
  // Pastel Swatch Click (Zero toast spam, instant flat color application)
  container.querySelectorAll('[data-pastel-hex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.getAttribute('data-pastel-hex');
      setAccentColor(hex);
      playRelayClick();
      renderSettingsView(container);
    });
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
