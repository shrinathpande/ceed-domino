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
import { renderStatusPill } from '../components/status-pill.js';
import {
  startLockScreenTimer,
  stopLockScreenTimer
} from '../utils/lockscreen-timer.js';

const ACTIVE_TIMER_KEY = 'ceed_v2_active_timer';
const PILLAR_PALETTE = ['#34D399', '#FF69AF', '#A855F7', '#38BDF8', '#F59E0B'];

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
  const state = getState();
  const record = getDayRecord(activeDateStr);
  const activeTimer = getActiveTimer();
  const accentColor = getAccentColor();

  let todayStudyMins = 0;
  let todayWorkMins = 0;
  let todayTotalMins = 0;
  let totalTargetMins = 0;

  blocks.forEach(b => {
    const m = Number(record.durations[b.id]) || 0;
    todayTotalMins += m;
    totalTargetMins += b.targetMins || 60;
    if (b.category === 'STUDY') todayStudyMins += m;
    if (b.category === 'WORK') todayWorkMins += m;
  });

  const mandatoryBlocks = blocks.filter(isDominoTask);
  const completedDominoCount = mandatoryBlocks.filter(b => record.completed.includes(b.id)).length;
  const allDominosDone = mandatoryBlocks.length > 0 && completedDominoCount === mandatoryBlocks.length;

  // Calculate 7-Day Horizontal Calendar Strip (Mon - Sun)
  const curr = new Date(activeDateStr + 'T00:00:00');
  const dayOfWeek = curr.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMon);

  const weekDays = [];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const dayRec = state.records?.[dStr];
    const isComplete = dayRec && mandatoryBlocks.length > 0 && Array.isArray(dayRec.completed) && mandatoryBlocks.every(b => dayRec.completed.includes(b.id));
    weekDays.push({
      dateStr: dStr,
      label: dayLabels[i],
      dateNum: d.getDate(),
      isComplete,
      isSelected: dStr === activeDateStr
    });
  }

  // Dynamic 1-sentence narrative focus
  const sortedBlocks = [...blocks].sort((a, b) => (Number(record.durations[b.id]) || 0) - (Number(record.durations[a.id]) || 0));
  const topBlock = sortedBlocks[0];
  const topHours = ((Number(record.durations[topBlock?.id]) || 0) / 60).toFixed(1);
  const walkBlock = blocks.find(b => b.category === 'WALK') || blocks[0];
  const walkHours = ((Number(record.durations[walkBlock?.id]) || 0) / 60).toFixed(1);

  // Proportions for 36px Segmented Allocation Bar
  const allocDenominator = Math.max(todayTotalMins, totalTargetMins || 1);
  const remainingTargetMins = Math.max(0, totalTargetMins - todayTotalMins);
  const unloggedHatchPct = Math.round((remainingTargetMins / allocDenominator) * 100);

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3.5 pt-2 pb-28 font-sans select-none" aria-label="Today Dashboard">
      
      <!-- 7-Day Horizontal Circular Calendar Strip (Reference 6) -->
      <div class="flex items-center justify-between gap-1 mb-3.5 px-0.5">
        ${weekDays.map(w => `
          <button
            data-select-date="${w.dateStr}"
            class="flex flex-col items-center gap-1.5 btn-tactile focus:outline-none"
            aria-label="Select ${w.label} ${w.dateNum}"
          >
            <span class="text-[11px] font-medium ${w.isSelected ? 'text-white font-bold' : 'text-zinc-500'}">${w.label}</span>
            <div
              class="w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center font-bold text-xs transition-all relative ${
                w.isSelected
                  ? 'text-black shadow-lg shadow-white/10'
                  : 'bg-[#121215] text-zinc-300 border border-white/[0.07] hover:border-white/20'
              }"
              style="${w.isSelected ? `background-color: ${accentColor}; color: #000000;` : ''}"
            >
              <span>${w.dateNum}</span>
              ${w.isComplete && !w.isSelected ? `
                <span class="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1"></span>
              ` : ''}
            </div>
          </button>
        `).join('')}
      </div>

      <!-- Component A: Hero Output & Chunky Segmented Allocation Card (References 4 & 5) -->
      <div class="bento-card mb-3.5">
        <!-- Top of Card: Muted Label + Hero 42px Metric + Semantic Status Pill -->
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <div class="text-[12px] font-medium text-[#71717A] tracking-wide mb-1">Total Daily Output</div>
            <div class="text-[40px] font-extrabold text-white tracking-tight leading-none">
              ${(todayTotalMins / 60).toFixed(1)} <span class="text-xl font-medium text-zinc-500">HRS</span>
            </div>
          </div>
          <div>
            ${allDominosDone
              ? renderStatusPill('COMPLETED', '✓ Streak Locked')
              : renderStatusPill('PENDING', `${completedDominoCount}/${mandatoryBlocks.length} Dominos`)
            }
          </div>
        </div>

        <!-- 1-Sentence Dynamic Narrative with Inline Pill Badge -->
        <p class="text-xs text-zinc-400 leading-relaxed mb-4">
          Today's focus is led by
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style="background-color: ${accentColor}25; color: ${accentColor}; border: 1px solid ${accentColor}40;"
          >
            ${topBlock?.name || 'Study'} ${topHours}h
          </span>
          with ${walkHours}h of fitness logged.
        </p>

        <!-- 36px Tall Segmented Allocation Bar (Reference 4) -->
        <div class="h-9 rounded-xl overflow-hidden flex gap-1 p-1 bg-[#09090B] border border-white/5 mb-3.5">
          ${blocks.map((b, idx) => {
            const color = idx === 1 ? accentColor : PILLAR_PALETTE[idx % PILLAR_PALETTE.length];
            const bMins = Number(record.durations[b.id]) || 0;
            const pct = (bMins / allocDenominator) * 100;
            if (pct <= 0) return '';
            return `
              <div
                class="h-full rounded-lg transition-all duration-300"
                style="width: ${Math.max(4, pct)}%; background-color: ${color};"
                title="${b.name}: ${(bMins / 60).toFixed(1)}h"
              ></div>
            `;
          }).join('')}

          ${unloggedHatchPct > 0 ? `
            <div
              class="h-full rounded-lg bg-hatch flex-1 transition-all duration-300"
              title="Remaining Unlogged: ${(remainingTargetMins / 60).toFixed(1)}h"
            ></div>
          ` : ''}
        </div>

        <!-- 2-Column Vertical-Bar Legend (Reference 4) -->
        <div class="grid grid-cols-2 gap-2">
          ${blocks.map((b, idx) => {
            const color = idx === 1 ? accentColor : PILLAR_PALETTE[idx % PILLAR_PALETTE.length];
            const bMins = Number(record.durations[b.id]) || 0;
            const bHours = (bMins / 60).toFixed(1);
            const sharePct = todayTotalMins > 0 ? Math.round((bMins / todayTotalMins) * 100) : 0;
            return `
              <div class="flex items-center gap-2 p-2 rounded-xl bg-[#1A1A1F]/70 border border-white/[0.04]">
                <div class="w-[3px] h-6 rounded-full shrink-0" style="background-color: ${color};"></div>
                <div class="min-w-0 flex-1">
                  <div class="text-[12px] text-zinc-200 font-medium truncate">${b.name}</div>
                  <div class="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>${bHours}h</span>
                    <span>${sharePct}%</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Component B: Expressive Domino Cards with Ruler-Tick Slider (References 1 & 5) -->
      <div class="flex flex-col gap-3">
        ${blocks.map((b, idx) => {
          const color = idx === 1 ? accentColor : PILLAR_PALETTE[idx % PILLAR_PALETTE.length];
          return renderDominoBlockCard(b, record, activeTimer, color, accentColor);
        }).join('')}
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

function renderDominoBlockCard(block, record, activeTimer, pillarColor, accentColor) {
  const loggedMins = Number(record.durations[block.id]) || 0;
  const targetMins = block.targetMins || 60;
  const isDone = Array.isArray(record.completed) && record.completed.includes(block.id);
  const isMandatory = isDominoTask(block);
  const isExpanded = expandedBlockId === block.id;
  const isRunning = activeTimer && activeTimer.blockId === block.id;

  const pct = Math.min(100, Math.round((loggedMins / Math.max(1, targetMins)) * 100));
  const isUnder = isDone && loggedMins < targetMins;

  // Determine Semantic Status Pill
  let statusPillHtml = '';
  if (isRunning) {
    statusPillHtml = renderStatusPill('LIVE', 'Live Active');
  } else if (isDone && isUnder) {
    statusPillHtml = renderStatusPill('UNDER_FLOOR', 'Under Floor');
  } else if (isDone) {
    statusPillHtml = renderStatusPill('COMPLETED', 'Completed');
  } else if (!isMandatory) {
    statusPillHtml = renderStatusPill('ROUTINE', 'Routine');
  } else {
    statusPillHtml = renderStatusPill('PENDING', 'Pending');
  }

  return `
    <div
      class="bento-card cursor-pointer select-none transition-all duration-200"
      style="${isDone ? `border-color: ${pillarColor}40; box-shadow: 0 4px 24px -2px ${pillarColor}20;` : ''}"
      data-card-id="${block.id}"
      role="button"
      tabindex="0"
      aria-expanded="${isExpanded}"
      aria-label="${block.name} Domino Card"
    >
      <!-- Main Card Face -->
      <div class="flex flex-col gap-2.5">
        <!-- Top Row: Semantic Status Pill (Left) + Hours Readout & Circular Check Button (Right) -->
        <div class="flex items-center justify-between gap-2">
          <div>
            ${statusPillHtml}
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <span class="text-xs font-mono tabular-nums text-zinc-300">
              <strong class="text-white">${(loggedMins / 60).toFixed(1)}h</strong> / ${(targetMins / 60).toFixed(1)}h
            </span>

            <!-- Dedicated 38x38px Circular Checkmark Button (Reference 1) -->
            <button
              data-manual-toggle="${block.id}"
              data-target-mins="${targetMins}"
              class="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-sm btn-tactile transition-all shrink-0"
              style="${
                isDone
                  ? `background-color: ${pillarColor}; color: #000000; box-shadow: 0 0 12px ${pillarColor}60;`
                  : 'background-color: #1A1A1F; border: 1px solid rgba(255, 255, 255, 0.12); color: #71717A;'
              }"
              aria-label="${isDone ? 'Uncheck Domino (Resets to 0h)' : 'Complete Domino'}"
              title="${isDone ? 'Tap to unmark (resets to 0h)' : 'Tap to mark complete'}"
            >
              ${isDone ? '✓' : '○'}
            </button>
          </div>
        </div>

        <!-- Middle Row: Clean 17px Bold Title -->
        <div class="flex items-baseline justify-between gap-2">
          <h3 class="text-[17px] font-bold text-[#F4F4F5] tracking-tight truncate">${block.name}</h3>
          <span class="text-xs font-mono font-bold" style="color: ${pct >= 100 ? pillarColor : '#A1A1AA'};">${pct}%</span>
        </div>

        <!-- Bottom Row: 3-Texture Progress Bar (Solid Fill + Hatched Timer + Track) -->
        <div class="h-2 rounded-full overflow-hidden flex bg-[#1A1A1F] border border-white/[0.04]">
          <div
            class="liquid-progress h-full rounded-full transition-all duration-300"
            style="width: ${pct}%; background-color: ${pillarColor};"
          ></div>
          ${isRunning ? `
            <div class="h-full bg-hatch-light flex-1 animate-pulse"></div>
          ` : ''}
        </div>

        <!-- Running Timer Banner (If Active) -->
        ${isRunning ? `
          <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span>LIVE TIMER:</span>
              <span data-live-sw class="text-white font-extrabold">0m 00s</span>
            </div>
            <span class="text-[10px] text-blue-300 font-sans">Lock-Screen Synced</span>
          </div>
        ` : ''}
      </div>

      <!-- Expanded Drawer: Tactile Ruler Slider & Steppers (Reference 5) -->
      ${isExpanded ? `
        <div class="mt-4 pt-4 border-t border-white/[0.07] flex flex-col gap-3.5" data-drawer>
          <!-- Tactile Slider Box -->
          <div class="bento-subcard p-3.5 flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs font-medium">
              <span class="text-[#71717A]">Time Allocation</span>
              <span class="text-white font-mono font-bold text-xs" data-slider-readout="${block.id}">
                ${(loggedMins / 60).toFixed(1)}h (${loggedMins}m)
              </span>
            </div>

            <!-- Subtle Vertical-Tick Ruler Track (Reference 5) -->
            <div class="relative py-1">
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value="${loggedMins}"
                data-slider-block="${block.id}"
                class="w-full cursor-pointer relative z-10"
                aria-label="Adjust hours for ${block.name}"
              />
              <div class="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
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

          <!-- Bottom Action Row inside Drawer: Steppers + Solid White Pill CTA Button -->
          <div class="flex items-center justify-between gap-2">
            <!-- -15m and +15m Circular Stepper Buttons -->
            <div class="flex items-center gap-2">
              <button
                data-step-mins="-15"
                data-block="${block.id}"
                class="w-9 h-9 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/25 text-white font-bold text-xs flex items-center justify-center btn-tactile"
                aria-label="Decrease 15 minutes"
              >
                -15m
              </button>
              <button
                data-step-mins="15"
                data-block="${block.id}"
                class="w-9 h-9 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/25 text-white font-bold text-xs flex items-center justify-center btn-tactile"
                aria-label="Increase 15 minutes"
              >
                +15m
              </button>
            </div>

            <!-- High-Contrast Solid White Pill CTA Button (Reference 5 Schedule MO style) -->
            <button
              data-timer-toggle="${block.id}"
              class="h-10 px-5 rounded-full font-bold text-xs uppercase flex items-center gap-1.5 btn-tactile shadow-lg ${
                isRunning
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white text-black hover:bg-zinc-100'
              }"
              aria-label="${isRunning ? 'Stop Timer' : 'Start Timer'}"
            >
              <span>${isRunning ? '⏹ Stop Session' : '▶ Start Timer'}</span>
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function bindDashboardEvents(container, record, blocks) {
  // Calendar Strip Date Selection
  container.querySelectorAll('[data-select-date]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateStr = btn.getAttribute('data-select-date');
      activeDateStr = dateStr;
      playRelayClick();
      renderDashboard(container, null, activeDateStr);
    });
  });

  // Universal Card Tap to Expand/Collapse (Only ONE card open at a time)
  container.querySelectorAll('[data-card-id]').forEach(card => {
    const toggleExpansion = (e) => {
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

  // Dedicated Circular Checkmark Button: Two-Way Toggle
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
        rec.completed = rec.completed.filter(x => x !== id);
        rec.durations[id] = 0;
        recalculateStreak(state);
        saveState(state);
        playRelayClick();
      } else {
        if (!rec.completed.includes(id)) {
          rec.completed.push(id);
        }
        rec.durations[id] = targetMins;
        recalculateStreak(state);
        saveState(state);
        playRelayClick();
      }
      renderDashboard(container);
    });
  });

  // Direct Card Face / Drawer Timer Toggle
  container.querySelectorAll('[data-timer-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const blockId = btn.getAttribute('data-timer-toggle');
      const activeTimer = getActiveTimer();

      if (activeTimer && activeTimer.blockId === blockId) {
        const elapsedSec = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));
        stopLockScreenTimer();
        localStorage.removeItem(ACTIVE_TIMER_KEY);
        logHours(activeDateStr, blockId, elapsedMins, 'Live Timer Session');
      } else {
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
        startLockScreenTimer(block || { name: 'Study Session', badge: 'DOMINO' }, newTimer.startedAt, () => {
          renderDashboard(container);
        });
      }
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Custom Time Slider
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
      renderDashboard(container);
    });
  });
}
