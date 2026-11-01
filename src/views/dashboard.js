// src/views/dashboard.js
import {
  getBlocks,
  getDayRecord,
  logHours,
  setDominoDuration,
  isDominoTask,
  getState,
  saveState,
  recalculateStreak,
  getAccentColor
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { showInAppToast } from '../components/header.js';
import {
  startLockScreenTimer,
  stopLockScreenTimer
} from '../utils/lockscreen-timer.js';

const ACTIVE_TIMER_KEY = 'ceed_v2_active_timer';

let expandedBlockId = null;
let activeDateStr = new Date().toISOString().slice(0, 10);
let liveStopwatchInterval = null;

function getActiveTimer() {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function renderDashboard(container, onSettings = null, targetDate = null) {
  if (targetDate && typeof targetDate === 'string') {
    activeDateStr = targetDate;
  }
  if (liveStopwatchInterval) clearInterval(liveStopwatchInterval);

  const blocks = getBlocks();
  const record = getDayRecord(activeDateStr);
  const activeTimer = getActiveTimer();
  const accentColor = getAccentColor();

  let todayStudyMins = 0;
  let todayWorkMins = 0;
  let todayTotalMins = 0;

  blocks.forEach(b => {
    const m = Number(record.durations[b.id]) || 0;
    todayTotalMins += m;
    if (b.category === 'STUDY') todayStudyMins += m;
    if (b.category === 'WORK') todayWorkMins += m;
  });

  (record.customMins || []).forEach(entry => {
    const m = Number(entry.mins) || 0;
    todayTotalMins += m;
    if (entry.category === 'STUDY') todayStudyMins += m;
    if (entry.category === 'WORK') todayWorkMins += m;
  });

  const mandatoryBlocks = blocks.filter(isDominoTask);
  const completedDominoCount = mandatoryBlocks.filter(b => record.completed.includes(b.id)).length;
  const allDominosDone = mandatoryBlocks.length > 0 && completedDominoCount === mandatoryBlocks.length;

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3 pt-2 pb-24 font-mono select-none" aria-label="Dashboard">
      <!-- Date Picker & Streak Status Card -->
      <div
        class="card-shell border p-2.5 mb-2.5 flex items-center justify-between"
        style="${allDominosDone ? `border-color: ${accentColor}; background-color: #10050b;` : 'border-color: #262626; background-color: #0a0a0a;'}"
      >
        <div class="flex items-center gap-2">
          <input
            type="date"
            id="dash-date-picker"
            value="${activeDateStr}"
            class="bg-transparent text-xs font-bold text-white uppercase focus:outline-none cursor-pointer"
            aria-label="Select Date"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <span
            class="text-[11px] font-bold"
            style="color: ${allDominosDone ? accentColor : '#888888'};"
          >
            ${allDominosDone ? '★ STREAK LOCKED' : `${completedDominoCount}/${mandatoryBlocks.length} DOMINOS`}
          </span>
        </div>
      </div>

      <!-- Dual Daily Hour Ledger -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <!-- Study Card -->
        <div class="card-shell border border-neutral-800 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">STUDY TIME</div>
          <div class="text-2xl font-bold mt-1 mb-0.5" style="color: ${accentColor};">
            ${(todayStudyMins / 60).toFixed(1)} <span class="text-xs font-normal text-neutral-400">HRS</span>
          </div>
          <div class="text-[10px] text-neutral-400">
            Total Target Floor Met
          </div>
        </div>

        <!-- Productive Card -->
        <div class="card-shell border border-neutral-700 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">TOTAL PRODUCTIVE</div>
          <div class="text-2xl font-bold text-white mt-1 mb-0.5">
            ${(todayTotalMins / 60).toFixed(1)} <span class="text-xs font-normal text-neutral-400">HRS</span>
          </div>
          <div class="text-[10px] text-neutral-400">
            Work: ${(todayWorkMins / 60).toFixed(1)}h • ${todayTotalMins}m
          </div>
        </div>
      </div>

      <!-- Daily Domino Pillars Stream -->
      <div class="text-[10px] text-neutral-400 uppercase tracking-wider mb-2 flex justify-between items-center px-0.5">
        <span>DAILY DOMINOS (TAP CARD TO ADJUST)</span>
        <span class="text-[9px]" style="color: ${accentColor};">OLED SLIDER</span>
      </div>

      <div class="flex flex-col gap-2.5 mb-3">
        ${blocks.map(b => renderDominoBlockCard(b, record, activeTimer, accentColor)).join('')}
      </div>

      <!-- Universal Quick-Log Bar -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-2.5 mb-3">
        <div class="text-[10px] text-neutral-400 uppercase mb-2 flex justify-between items-center">
          <span>+ QUICK LOG ACTIVITY</span>
          <span class="text-white font-bold text-[9px]">DIRECT</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          <button data-quick-cat="STUDY" class="btn-tactile h-10 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-white active:text-black">
            + 1h STUDY
          </button>
          <button data-quick-cat="WORK" class="btn-tactile h-10 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-white active:text-black">
            + 1h WORK
          </button>
          <button data-quick-cat="WALK" class="btn-tactile h-10 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-white active:text-black">
            + 1h WALK
          </button>
        </div>
      </div>

      <!-- Today's Activity Feed -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-2.5">
        <div class="text-[10px] text-neutral-400 uppercase mb-2">
          TODAY'S ACTIVITY LOG (${(record.logs || []).length})
        </div>
        ${(record.logs || []).length === 0 ? `
          <div class="text-[11px] text-neutral-500 py-2">No activity logged yet today. Tap any card above.</div>
        ` : `
          <div class="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            ${record.logs.map(item => `
              <div class="flex items-center justify-between text-[11px] border-b border-neutral-900 pb-1">
                <div class="truncate pr-2">
                  <span class="text-neutral-500">[${item.time}]</span>
                  <span class="text-white ml-1">${item.label}</span>
                </div>
                <span class="font-bold shrink-0" style="color: ${item.mins >= 0 ? accentColor : '#888888'};">
                  ${item.mins >= 0 ? '+' : ''}${(item.mins / 60).toFixed(1)}h (${item.mins}m)
                </span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </section>
  `;

  bindDashboardEvents(container, record, blocks);

  if (activeTimer) {
    liveStopwatchInterval = setInterval(() => {
      const el = container.querySelector('[data-live-sw]');
      if (el) {
        const sec = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        const m = Math.floor(sec / 60);
        const s = String(sec % 60).padStart(2, '0');
        el.textContent = `${m}m ${s}s`;
      }
    }, 1000);
  }
}

function renderDominoBlockCard(block, record, activeTimer, accentColor) {
  const loggedMins = Number(record.durations[block.id]) || 0;
  const targetMins = block.targetMins || 60;
  const isDone = Array.isArray(record.completed) && record.completed.includes(block.id);
  const isMandatory = isDominoTask(block);
  const isExpanded = expandedBlockId === block.id;
  const isRunning = activeTimer && activeTimer.blockId === block.id;

  const pct = Math.min(100, Math.round((loggedMins / Math.max(1, targetMins)) * 100));

  const borderStyle = isDone
    ? `border-2 border-[${accentColor}] bg-[#0c0409]`
    : isRunning
    ? 'border-2 border-white bg-[#0e0e0e]'
    : 'border border-neutral-800 bg-[#0c0c0c]';

  const inlineBorderStyle = isDone
    ? `border: 2px solid ${accentColor}; background-color: #0c0409; box-shadow: 0 0 10px ${accentColor}33;`
    : isRunning
    ? 'border: 2px solid #ffffff; background-color: #0e0e0e;'
    : 'border: 1px solid #262626; background-color: #0c0c0c;';

  return `
    <div
      class="card-shell cursor-pointer select-none"
      style="${inlineBorderStyle}"
      data-card-id="${block.id}"
      role="button"
      tabindex="0"
      aria-expanded="${isExpanded}"
      aria-label="${block.name} Domino Card"
    >
      <!-- Card Face Content -->
      <div class="p-3">
        <!-- Top Row: Badge, Category, and Action Buttons (Timer + Square Corner Checkmark) -->
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class="btn-tactile px-1.5 py-0.5 font-bold text-[10px]"
              style="${isMandatory ? `background-color: ${accentColor}; color: #000000;` : 'border: 1px solid #404040; color: #a3a3a3;'}"
            >
              ${block.badge}
            </span>
            <span class="text-neutral-400 text-[10px] uppercase font-mono tracking-wider">${block.category}</span>
          </div>

          <!-- Action Buttons Group: Direct Timer Button + Dedicated Square Checkmark Button -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Direct Card Face Timer Button -->
            <button
              data-timer-toggle="${block.id}"
              class="btn-tactile h-8 px-2.5 border ${
                isRunning
                  ? 'border-white bg-white text-black font-extrabold animate-pulse'
                  : 'border-neutral-700 bg-[#161616] text-neutral-200 hover:text-white font-bold'
              } text-[10px] uppercase flex items-center gap-1 rounded"
              aria-label="${isRunning ? 'Stop Live Timer' : 'Start Live Timer'}"
              title="${isRunning ? 'Click to stop timer' : 'Click to start timer'}"
            >
              <span>${isRunning ? '⏹ STOP' : '▶ TIMER'}</span>
            </button>

            <!-- Dedicated Corner Checkmark Square Button -->
            <button
              data-manual-toggle="${block.id}"
              data-target-mins="${targetMins}"
              class="btn-tactile w-8 h-8 border-2 font-bold text-sm flex items-center justify-center rounded shrink-0"
              style="${
                isDone
                  ? `border-color: ${accentColor}; background-color: ${accentColor}; color: #000000;`
                  : 'border-color: #525252; background-color: #000000; color: #ffffff;'
              }"
              aria-label="${isDone ? 'Uncheck and Reset to 0h' : 'Complete Domino'}"
              title="${isDone ? 'Tap to unmark (resets to 0h)' : 'Tap to mark done (sets to target)'}"
            >
              ${isDone ? '✓' : '○'}
            </button>
          </div>
        </div>

        <!-- Second Row: Pillar Name + High Contrast Percentage & Hours -->
        <div class="flex items-baseline justify-between gap-2 mb-2">
          <div class="text-xs font-bold text-white truncate">${block.name}</div>
          <div class="flex items-baseline gap-1.5 shrink-0 font-mono">
            <span class="text-xs font-extrabold" style="color: ${pct >= 100 ? accentColor : '#ffffff'};">${pct}%</span>
            <span class="text-[10px] text-neutral-400">(${(loggedMins / 60).toFixed(1)}h / ${(targetMins / 60).toFixed(1)}h)</span>
          </div>
        </div>

        <!-- High-Contrast Liquid Progress Bar -->
        <div class="w-full h-2 bg-black border border-neutral-800 rounded-full overflow-hidden">
          <div
            class="liquid-progress h-full"
            style="width: ${pct}%; background-color: ${accentColor};"
          ></div>
        </div>

        <!-- Live Stopwatch Banner (Nested within card on Today page when active) -->
        ${isRunning ? `
          <div class="mt-2.5 p-2 bg-white/5 border border-white/20 rounded flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <span class="inline-block w-2 h-2 rounded-full animate-ping" style="background-color: ${accentColor};"></span>
              <span>LIVE SESSION:</span>
              <span data-live-sw class="text-white font-extrabold">0m 00s</span>
            </div>
            <span class="text-[9px] text-neutral-400 uppercase">Lock-Screen Active</span>
          </div>
        ` : ''}
      </div>

      <!-- Expanded Drawer: Precision Time Slider & Steppers -->
      ${isExpanded ? `
        <div class="px-3 pb-3 pt-2 border-t border-neutral-800/80 bg-black/60 flex flex-col gap-2.5" data-drawer>
          <div class="border border-neutral-800 bg-[#080808] p-3 rounded-lg flex flex-col gap-2">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">CUSTOMIZE LOGGED TIME</span>
              <span class="text-white font-mono font-bold text-xs" data-slider-readout="${block.id}">
                ${(loggedMins / 60).toFixed(1)}h (${loggedMins}m)
              </span>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button
                data-step-mins="-15"
                data-block="${block.id}"
                class="btn-tactile h-9 px-3 border border-neutral-700 bg-black text-xs font-bold text-neutral-300 hover:text-white shrink-0"
                aria-label="Decrease 15 minutes"
              >
                -15m
              </button>

              <div class="flex-1 px-1">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value="${loggedMins}"
                  data-slider-block="${block.id}"
                  class="w-full cursor-pointer"
                  aria-label="Adjust minutes logged"
                />
              </div>

              <button
                data-step-mins="15"
                data-block="${block.id}"
                class="btn-tactile h-9 px-3 border border-neutral-700 bg-black text-xs font-bold text-neutral-300 hover:text-white shrink-0"
                aria-label="Increase 15 minutes"
              >
                +15m
              </button>
            </div>

            <div class="flex items-center justify-between text-[9px] text-neutral-500 font-mono px-1">
              <span>0h</span>
              <span>1h</span>
              <span>2h</span>
              <span>3h</span>
              <span>4h</span>
              <span>5h</span>
              <span>6h</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function bindDashboardEvents(container, record, blocks) {
  // Date Picker
  container.querySelector('#dash-date-picker')?.addEventListener('change', (e) => {
    activeDateStr = e.target.value;
    playRelayClick();
    renderDashboard(container);
  });

  // Universal Card Tap to Expand/Collapse (Tapping card body opens customization)
  container.querySelectorAll('[data-card-id]').forEach(card => {
    const toggleExpansion = (e) => {
      // If tap originated from an interactive child button, ignore card toggle
      if (e.target.closest('button, input, select, textarea, [data-manual-toggle], [data-timer-toggle], [data-slider-block], [data-step-mins]')) {
        return;
      }
      const id = card.getAttribute('data-card-id');
      expandedBlockId = expandedBlockId === id ? null : id;
      playRelayClick();
      renderDashboard(container);
    };

    card.addEventListener('click', toggleExpansion);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleExpansion(e);
      }
    });
  });

  // Dedicated Corner Checkmark Button: Two-Way Toggle
  container.querySelectorAll('[data-manual-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = btn.getAttribute('data-manual-toggle');
      const targetMins = Number(btn.getAttribute('data-target-mins')) || 60;
      const state = getState();
      const rec = getDayRecord(activeDateStr);
      const isDone = Array.isArray(rec.completed) && rec.completed.includes(id);

      if (isDone) {
        // UNCHECK: Remove from completed and reset duration to 0 (card resets to zero)
        rec.completed = rec.completed.filter(x => x !== id);
        rec.durations[id] = 0;
        recalculateStreak(state);
        saveState(state);
        playRelayClick();
        showInAppToast('Domino unmarked (0.0h)');
      } else {
        // CHECK: Add to completed and set duration to target floor (fills to 100%)
        if (!rec.completed.includes(id)) {
          rec.completed.push(id);
        }
        rec.durations[id] = targetMins;
        recalculateStreak(state);
        saveState(state);
        playRelayClick();
        showInAppToast(`★ ${(targetMins / 60).toFixed(1)}h Completed!`, true);
      }
      renderDashboard(container);
    });
  });

  // Direct Card Face Live Timer Toggle
  container.querySelectorAll('[data-timer-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const blockId = btn.getAttribute('data-timer-toggle');
      const activeTimer = getActiveTimer();

      if (activeTimer && activeTimer.blockId === blockId) {
        // Stop active timer & commit elapsed time
        const elapsedSec = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));
        stopLockScreenTimer();
        localStorage.removeItem(ACTIVE_TIMER_KEY);
        logHours(activeDateStr, blockId, elapsedMins, 'Live Timer Session');
        showInAppToast(`Timer Stopped! +${elapsedMins}m logged`, true);
      } else {
        // If another timer is running, stop it first
        if (activeTimer) {
          stopLockScreenTimer();
          localStorage.removeItem(ACTIVE_TIMER_KEY);
        }
        const block = blocks.find(b => b.id === blockId);
        const newTimer = {
          blockId,
          name: block ? block.name : 'Study Session',
          startedAt: Date.now()
        };
        localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(newTimer));
        startLockScreenTimer(`${block?.badge || 'CEED'} • ${block?.name || 'Session'}`, 'Focus Session Running');
        showInAppToast(`Timer Started for ${block?.name || 'Domino'}`, true);
      }
      renderDashboard(container);
    });
  });

  // Custom Time Slider (Live scrubbing + Commit)
  container.querySelectorAll('[data-slider-block]').forEach(slider => {
    const blockId = slider.getAttribute('data-slider-block');
    const readout = container.querySelector(`[data-slider-readout="${blockId}"]`);

    slider.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = Number(e.target.value);
      if (readout) {
        readout.textContent = `${(val / 60).toFixed(1)}h (${val}m)`;
      }
    });

    slider.addEventListener('change', (e) => {
      e.stopPropagation();
      const val = Number(e.target.value);
      setDominoDuration(blockId, activeDateStr, val);
      playRelayClick();
      showInAppToast(`Saved ${(val / 60).toFixed(1)}h (${val}m)`);
      renderDashboard(container);
    });
  });

  // -15m and +15m Steppers
  container.querySelectorAll('[data-step-mins]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blockId = btn.getAttribute('data-block');
      const step = Number(btn.getAttribute('data-step-mins'));
      const rec = getDayRecord(activeDateStr);
      const current = Number(rec.durations[blockId]) || 0;
      const next = Math.max(0, Math.min(360, current + step));
      setDominoDuration(blockId, activeDateStr, next);
      playRelayClick();
      showInAppToast(`Set to ${(next / 60).toFixed(1)}h (${next}m)`);
      renderDashboard(container);
    });
  });

  // Quick Log Buttons (+1h STUDY, +1h WORK, +1h WALK)
  container.querySelectorAll('[data-quick-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = btn.getAttribute('data-quick-cat');
      const matchingBlock = blocks.find(b => b.category === cat) || blocks[0];
      if (matchingBlock) {
        logHours(activeDateStr, matchingBlock.id, 60, `+1.0h Quick ${cat}`);
        showInAppToast(`+1.0h Logged to ${matchingBlock.name}`, true);
        renderDashboard(container);
      }
    });
  });
}
