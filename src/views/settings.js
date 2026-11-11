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
  getCardInfusionScope,
  setCardInfusionScope,
  isOledMode,
  setOledMode,
  resetState
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { icons } from '../components/icons.js';

// The 6 Flat Soft Pastel Swatches (Defaulting to Soft Lavender #C4B5FD)
const PASTEL_SWATCHES = [
  { name: 'Soft Lavender', hex: '#C4B5FD' },
  { name: 'Soft Periwinkle', hex: '#A5C4FF' },
  { name: 'Soft Sage Mint', hex: '#A7F3D0' },
  { name: 'Soft Peach Butter', hex: '#FDE6B8' },
  { name: 'Soft Blush Rose', hex: '#FBCFE8' },
  { name: 'Crisp Chalk White', hex: '#F4F4F6' }
];

export function renderSettingsView(container) {
  const blocks = getBlocks();
  const state = getState();
  const currentAccent = getAccentColor();
  const currentScope = getCardInfusionScope();
  const isCustomPreset = !PASTEL_SWATCHES.some(s => s.hex.toLowerCase() === currentAccent.toLowerCase());
  const isOled = isOledMode();

  container.innerHTML = `
    <section class="w-full max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-6 select-none" aria-label="Configuration Terminal">
      
      <!-- 0. AMOLED Pitch-Black OLED Mode Switch -->
      <div class="bento-card mb-3.5 stagger-item stagger-delay-0">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-black border border-[var(--domino-accent)] shadow-[0_0_8px_var(--domino-accent)]"></span>
              <span class="text-base font-bold text-[#F4F4F6] tracking-tight">AMOLED Pitch-Black OLED Mode</span>
            </div>
            <div class="text-xs text-[#71717A] mt-1">True #000000 pixel shutoff with radiant user-chosen color accents & borders</div>
          </div>
          <button
            id="btn-oled-toggle"
            type="button"
            class="px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider btn-tactile transition-all shrink-0 flex items-center gap-1.5 ${
              isOled
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'bg-[#18181B] text-[#71717A] border border-[#27272A] hover:text-[#F4F4F6]'
            }"
            aria-label="Toggle AMOLED OLED Mode"
          >
            <span class="w-2 h-2 rounded-full ${isOled ? 'bg-[#09090B]' : 'bg-[#71717A]'}"></span>
            <span>${isOled ? 'ACTIVE [ON]' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <!-- 1. Curated Soft Pastel Swatches + Custom Color Picker -->
      <div class="bento-card mb-3.5 stagger-item stagger-delay-1">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-base font-bold text-[#F4F4F6] tracking-tight">Soft Pastel Palette</div>
            <div class="text-xs text-[#71717A] mt-0.5">Card background tint and focal accent hue</div>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18181B] border border-[#27272A]">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${currentAccent};"></span>
            <span class="text-xs font-mono font-medium text-[#F4F4F6] uppercase">${currentAccent}</span>
          </div>
        </div>

        <!-- Preset Swatches + Custom Color Swatch -->
        <div class="grid grid-cols-7 gap-1.5 pt-1 items-center">
          ${PASTEL_SWATCHES.map(s => {
            const isSelected = s.hex.toLowerCase() === currentAccent.toLowerCase();
            return `
              <button
                data-pastel-hex="${s.hex}"
                class="w-10 h-10 rounded-full transition-all btn-tactile relative flex items-center justify-center mx-auto ${
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

          <!-- 7th Slot: Interactive Custom Color Wheel Button -->
          <div class="relative w-10 h-10 mx-auto">
            <button
              type="button"
              id="btn-custom-picker-trigger"
              class="w-10 h-10 rounded-full transition-all btn-tactile relative flex items-center justify-center ${
                isCustomPreset ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : 'hover:opacity-90'
              }"
              style="background: ${isCustomPreset ? currentAccent : 'conic-gradient(from 180deg, #F87171, #FBBF24, #34D399, #60A5FA, #C084FC, #F472B6, #F87171)'}; border: 1px solid rgba(255,255,255,0.2);" /* taste-skill-ignore */
              title="Pick Custom Color"
              aria-label="Pick Custom Color"
            >
              ${isCustomPreset ? `<span class="w-2 h-2 rounded-full bg-[#09090B]"></span>` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#09090B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
                </svg>
              `}
            </button>
            <input
              type="color"
              id="native-color-picker"
              value="${currentAccent}"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Custom Color Palette"
            />
          </div>
        </div>

        <!-- Custom Hex Input Row -->
        <div class="mt-3.5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <div class="text-[11.5px] font-medium text-[var(--text-muted)]">Custom Favorite Color</div>
          <div class="flex items-center gap-1.5">
            <div class="flex items-center bg-[#18181B] border border-[#27272A] rounded-full px-2.5 py-1">
              <span class="text-xs text-[#71717A] font-mono mr-0.5">#</span>
              <input
                type="text"
                id="input-custom-hex"
                maxlength="7"
                placeholder="C4B5FD"
                value="${currentAccent.replace('#', '')}"
                class="w-16 bg-transparent text-xs font-mono font-bold text-[#F4F4F6] uppercase focus:outline-none"
              />
            </div>
            <button
              type="button"
              id="btn-apply-hex"
              class="px-3 py-1 rounded-full text-xs font-bold bg-[var(--domino-accent)] text-[#09090B] btn-tactile shadow-sm"
            >
              Set
            </button>
          </div>
        </div>

        <!-- Card Pastel Infusion Scope Selector -->
        <div class="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <div class="text-[12px] font-semibold text-[#F4F4F6]">Pastel Glow Scope</div>
            <div class="text-[10.5px] text-[#71717A]">Apply color to cards</div>
          </div>
          <div class="flex items-center gap-1 bg-[#18181B] p-1 rounded-full border border-[#27272A]">
            <button
              type="button"
              data-set-scope="all"
              class="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all btn-tactile ${
                currentScope === 'all'
                  ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
              }"
            >
              All Cards
            </button>
            <button
              type="button"
              data-set-scope="hero"
              class="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all btn-tactile ${
                currentScope === 'hero'
                  ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
              }"
            >
              Hero Only
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Domino Pillar Editor (Clean Bento Rows) -->
      <div class="bento-card mb-3.5 stagger-item stagger-delay-2">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#1F1F23]">
          <div>
            <div class="text-base font-bold text-[#F4F4F6] tracking-tight">Domino Architecture</div>
            <div class="text-xs text-[#71717A] mt-0.5">Custom daily targets & categories</div>
          </div>
          <button id="btn-reset-blocks" class="text-xs text-[#71717A] hover:text-[#F4F4F6] underline" aria-label="Restore factory default domino pillars">Restore Factory Defaults</button>
        </div>

        <div class="flex flex-col gap-2.5 mb-3.5">
          ${blocks.map((b) => {
            const targetHrs = (b.targetMins / 60).toFixed(1);
            return `
              <div class="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col gap-2" data-block-id="${b.id}">
                <!-- Row 1: Badge + Category Pill + Delete -->
                <div class="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    data-edit-badge="${b.id}"
                    value="${b.badge}"
                    maxlength="24"
                    class="w-28 bg-[#121214] border border-[#27272A] text-xs px-2.5 py-1 font-semibold text-[#F4F4F6] uppercase rounded-full focus:outline-none"
                    placeholder="DOMINO 1"
                    aria-label="Pillar badge identifier"
                  />

                  <div class="flex items-center gap-2">
                    <select
                      data-edit-cat="${b.id}"
                      class="bg-[#121214] border border-[#27272A] text-xs text-[#A1A1AA] px-2.5 py-1 rounded-full focus:outline-none cursor-pointer"
                      aria-label="Pillar activity category"
                    >
                      <option value="STUDY" ${b.category === 'STUDY' ? 'selected' : ''}>STUDY</option>
                      <option value="WORK" ${b.category === 'WORK' ? 'selected' : ''}>WORK</option>
                      <option value="WALK" ${b.category === 'WALK' ? 'selected' : ''}>WALK</option>
                      <option value="OTHER" ${b.category === 'OTHER' ? 'selected' : ''}>OTHER</option>
                    </select>

                    ${blocks.length > 1 ? `
                      <button
                        data-delete-block="${b.id}"
                        class="w-8 h-8 rounded-full bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white flex items-center justify-center btn-tactile"
                        title="Delete Pillar"
                        aria-label="Delete this domino pillar"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                    maxlength="80"
                    class="w-full bg-transparent text-sm text-[#F4F4F6] font-medium tracking-tight focus:outline-none placeholder-zinc-500"
                    placeholder="Pillar Name"
                    aria-label="Pillar title"
                  />
                </div>

                <!-- Row 3: Target Hours Steppers (-0.5h / +0.5h) -->
                <div class="flex items-center justify-between pt-1 text-xs border-t border-[#27272A]">
                  <span class="text-[#71717A] font-medium">Daily Target Floor</span>
                  <div class="flex items-center gap-2">
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="-30"
                      class="w-8 h-8 rounded-full bg-[#121214] border border-[#27272A] text-[#F4F4F6] font-bold flex items-center justify-center btn-tactile text-sm"
                      aria-label="Decrease daily floor by 30 minutes"
                    >
                      -
                    </button>
                    <span class="font-mono font-semibold text-[#F4F4F6] text-xs w-10 text-center">${targetHrs}h</span>
                    <button
                      data-step-target="${b.id}"
                      data-step-delta="30"
                      class="w-8 h-8 rounded-full bg-[#121214] border border-[#27272A] text-[#F4F4F6] font-bold flex items-center justify-center btn-tactile text-sm"
                      aria-label="Increase daily floor by 30 minutes"
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

      <!-- 3. Backup & Factory Reset -->
      <div class="bento-card mb-3.5 stagger-item stagger-delay-3">
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
          class="w-full h-10 mt-2 rounded-full bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 text-[13px] font-semibold flex items-center justify-center gap-2 btn-tactile"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Factory Reset All Data
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
  // AMOLED OLED Mode Toggle
  container.querySelector('#btn-oled-toggle')?.addEventListener('click', () => {
    const next = !isOledMode();
    setOledMode(next);
    renderSettingsView(container);
  });

  // Pastel Swatch Click (Zero toast spam, instant flat color application)
  container.querySelectorAll('[data-pastel-hex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.getAttribute('data-pastel-hex');
      setAccentColor(hex);
      playRelayClick();
      renderSettingsView(container);
    });
  });

  // Native Color Picker input & change
  const nativePicker = container.querySelector('#native-color-picker');
  nativePicker?.addEventListener('input', (e) => {
    setAccentColor(e.target.value);
  });
  nativePicker?.addEventListener('change', (e) => {
    setAccentColor(e.target.value);
    playRelayClick();
    renderSettingsView(container);
  });

  // Custom Hex Input & Set button
  const handleApplyHex = () => {
    const input = container.querySelector('#input-custom-hex');
    if (!input) return;
    let hex = input.value.trim();
    if (!hex) return;
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      setAccentColor(hex);
      playRelayClick();
      renderSettingsView(container);
    } else {
      alert('Please enter a valid 3- or 6-digit hex code (e.g. C4B5FD or #FF7A59)');
    }
  };
  container.querySelector('#btn-apply-hex')?.addEventListener('click', handleApplyHex);
  container.querySelector('#input-custom-hex')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleApplyHex();
  });

  // Card Infusion Scope selector (All Cards vs Hero Only)
  container.querySelectorAll('[data-set-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.dataset.setScope;
      setCardInfusionScope(scope);
      playRelayClick();
      renderSettingsView(container);
    });
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
