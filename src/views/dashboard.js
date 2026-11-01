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
import { icons } from '../components/icons.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
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
  const state = getState();
  const record = getDayRecord(activeDateStr);
  const activeTimer = getActiveTimer();
  const accentColor = getAccentColor();

  let todayStudyMins = 0;
  let todayWorkFitnessMins = 0;
  let todayTotalMins = 0;
  let totalTargetMins = 0;
  let completedMins = 0;
  let inProgressMins = 0;

  blocks.forEach(b => {
    const m = Number(record.durations[b.id]) || 0;
    const target = b.targetMins || 60;
    const isDone = Array.isArray(record.completed) && record.completed.includes(b.id);
    todayTotalMins += m;
    totalTargetMins += target;

    if (b.category === 'STUDY') {
      todayStudyMins += m;
    } else {
      todayWorkFitnessMins += m;
    }

    if (isDone) {
      completedMins += m;
    } else if (m > 0) {
      inProgressMins += m;
    }
  });

  const mandatoryBlocks = blocks.filter(isDominoTask);
  const completedDominoCount = mandatoryBlocks.filter(b => record.completed.includes(b.id)).length;
  const dayIndex = getDayIndex(activeDateStr);
  const examCountdown = getExamCountdown();

  // 7-Day Horizontal Calendar Strip (Mon - Sun)
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

  // 3-Part Progress Bar Proportions (Reference 5)
  const totalAllocScale = Math.max(totalTargetMins, completedMins + inProgressMins || 1);
  const remainingMins = Math.max(0, totalTargetMins - completedMins - inProgressMins);
  const completedPct = Math.round((completedMins / totalAllocScale) * 100);
  const inProgressPct = Math.round((inProgressMins / totalAllocScale) * 100);
  const remainingPct = Math.max(0, 100 - completedPct - inProgressPct);

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-4 pt-2 pb-28 font-sans select-none" aria-label="Today Dashboard">
      
      <!-- 7-Day Horizontal Circular Calendar Strip (Reference 6) -->
      <div class="flex items-center justify-between gap-1 mb-4">
        ${weekDays.map(w => `
          <button
            data-select-date="${w.dateStr}"
            class="flex flex-col items-center gap-1.5 btn-tactile focus:outline-none"
            aria-label="Select ${w.label} ${w.dateNum}"
          >
            <span class="text-[11px] font-medium ${w.isSelected ? 'text-[#F4F4F6] font-bold' : 'text-[#71717A]'}">${w.label}</span>
            <div
              class="w-[38px] h-[38px] rounded-full flex flex-col items-center justify-center font-bold text-xs transition-all relative ${
                w.isSelected
                  ? 'text-[#09090B]'
                  : 'bg-[#121214] text-[#A1A1AA] border border-[#1F1F23]'
              }"
              style="${w.isSelected ? `background-color: ${accentColor}; color: #09090B; border: none;` : ''}"
            >
              <span>${w.dateNum}</span>
              ${w.isComplete && !w.isSelected ? `
                <span class="w-1 h-1 rounded-full bg-[#A7F3D0] absolute bottom-1"></span>
              ` : ''}
            </div>
          </button>
        `).join('')}
      </div>

      <!-- Reference 5: Daily Planning Hero Card -->
      <div class="bento-card mb-4">
        <!-- Header Row: Title | Vertical Rule | 2-Line Campaign Readout -->
        <div class="flex items-center gap-3.5 mb-2">
          <h2 class="text-[25px] font-medium text-[#F4F4F6] tracking-tight leading-none">Daily Planning</h2>
          <div class="w-[1px] h-8 bg-[#27272A]"></div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-[#F4F4F6] leading-snug">CEED Campaign</span>
            <span class="text-[11px] text-[#71717A] font-normal">Day ${dayIndex + 1} of 87 • ${examCountdown.compact} left</span>
          </div>
        </div>

        <!-- Reference 5 Signature 3-Part Progress Bar (Height 28px, 6px gap, 8px radius) -->
        <div class="h-7 flex gap-1.5 my-4">
          <!-- Segment 1: Completed Domino Hours (Solid Crisp White) -->
          ${completedPct > 0 ? `
            <div
              class="h-full rounded-lg bg-[#F4F4F6] transition-all duration-300"
              style="width: ${completedPct}%;"
              title="Completed: ${(completedMins / 60).toFixed(1)}h"
            ></div>
          ` : ''}

          <!-- Segment 2: In-Progress / Partial Hours (Hatch-Stripe Pill) -->
          ${inProgressPct > 0 ? `
            <div
              class="h-full rounded-lg hatch-stripes transition-all duration-300"
              style="width: ${inProgressPct}%;"
              title="In Progress: ${(inProgressMins / 60).toFixed(1)}h"
            ></div>
          ` : ''}

          <!-- Segment 3: Remaining Daily Target (Flat Charcoal) -->
          ${remainingPct > 0 ? `
            <div
              class="h-full rounded-lg bg-[#27272A] flex-1 transition-all duration-300"
              title="Remaining: ${(remainingMins / 60).toFixed(1)}h"
            ></div>
          ` : ''}
        </div>

        <!-- Reference 5 3-Column Sub-Metrics Row -->
        <div class="grid grid-cols-3 gap-2 pt-1 border-t border-[#1F1F23]">
          <!-- Column 1: Study Logged -->
          <div>
            <div class="text-[11px] font-medium text-[#71717A] mb-1">Study logged</div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-1 rounded-full bg-[#F4F4F6] shrink-0"></span>
              <span class="text-[17px] font-medium text-[#F4F4F6] font-mono">${(todayStudyMins / 60).toFixed(1)}h</span>
            </div>
          </div>

          <!-- Column 2: Work & Fitness -->
          <div>
            <div class="text-[11px] font-medium text-[#71717A] mb-1">Work & fitness</div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2 rounded hatch-stripes shrink-0"></span>
              <span class="text-[17px] font-medium text-[#F4F4F6] font-mono">${(todayWorkFitnessMins / 60).toFixed(1)}h</span>
            </div>
          </div>

          <!-- Column 3: Dominos Locked -->
          <div>
            <div class="text-[11px] font-medium text-[#71717A] mb-1">Dominos locked</div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-1 rounded-full bg-[#3F3F46] shrink-0"></span>
              <span class="text-[17px] font-medium text-[#F4F4F6] font-mono">${completedDominoCount} / ${mandatoryBlocks.length}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Domino Cards Stream (Reference 5 Precision Hardware Aesthetic) -->
      <div class="flex flex-col gap-3">
        ${blocks.map(b => renderDominoBlockCard(b, record, activeTimer, accentColor)).join('')}
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
        el.textContent = `${m}:${s}`;
      }
    }, 1000);
  }
}

function renderDominoBlockCard(block, record, activeTimer, accentColor) {
  const loggedMins = Number(record.durations[block.id]) || 0;
  const targetMins = block.targetMins || 60;
  const isDone = Array.isArray(record.completed) && record.completed.includes(block.id);
  const isExpanded = expandedBlockId === block.id;
  const isRunning = activeTimer && activeTimer.blockId === block.id;
  const isUnder = isDone && loggedMins < targetMins;

  // Determine Semantic Status Pill (Reference 1)
  let statusHtml = '';
  if (isRunning) {
    statusHtml = renderStatusPill('LIVE', 'In Progress');
  } else if (isDone && isUnder) {
    statusHtml = renderStatusPill('UNDER_FLOOR', 'Under Floor');
  } else if (isDone) {
    statusHtml = renderStatusPill('COMPLETED', 'Completed');
  } else if (loggedMins > 0) {
    statusHtml = renderStatusPill('LIVE', 'In Progress');
  } else {
    statusHtml = renderStatusPill('PENDING', 'Pending');
  }

  // Calculate 8 Discrete Capsule Pills (0.5h up to 4.0h)
  const capsuleIntervals = [30, 60, 90, 120, 150, 180, 210, 240];

  return `
    <div
      class="bento-card cursor-pointer select-none transition-all duration-200"
      data-card-id="${block.id}"
      role="button"
      tabindex="0"
      aria-expanded="${isExpanded}"
      aria-label="${block.name} Domino Card"
    >
      <!-- Closed Domino Card Face (Reference 5 Clean Hardware Module) -->
      <div class="flex items-center justify-between gap-3">
        <!-- Left Column: Status Pill + Category Tag + Clean Title -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-2">
            ${statusHtml}
            <span class="text-[11px] font-medium text-[#71717A] uppercase tracking-wider">${block.category}</span>
          </div>
          <h3 class="text-[17px] font-medium text-[#F4F4F6] tracking-tight truncate">${block.name}</h3>
        </div>

        <!-- Right Column: Tabular Hours + Flat Matte Circular Check Button -->
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs font-mono tabular-nums text-[#A1A1AA]">
            <strong class="text-[#F4F4F6]">${(loggedMins / 60).toFixed(1)}</strong> / ${(targetMins / 60).toFixed(1)}h
          </span>

          <button
            data-manual-toggle="${block.id}"
            data-target-mins="${targetMins}"
            class="w-9 h-9 rounded-full flex items-center justify-center font-bold btn-tactile transition-all shrink-0"
            style="${
              isDone
                ? 'background-color: #C6F6D5; color: #09090B; border: none;'
                : 'background-color: #18181B; border: 1.5px solid #3F3F46; color: transparent;'
            }"
            aria-label="${isDone ? 'Uncheck Domino' : 'Complete Domino'}"
            title="${isDone ? 'Uncheck and reset to 0h' : 'Check off target hours'}"
          >
            ${isDone ? icons.check(16, 3) : ''}
          </button>
        </div>
      </div>

      <!-- Expanded Drawer: Reference 5 "Raw Material Sourcing" Ruler & Capsule Control -->
      ${isExpanded ? `
        <div class="mt-5 pt-4 border-t border-[#1F1F23] flex flex-col gap-4" data-drawer>
          
          <!-- Inner Sub-Surface Well (#18181B, radius 18px) -->
          <div class="bento-subcard p-4 flex flex-col gap-2.5">
            
            <!-- Row 1: Floating White Pin Callout with micro-chevrons < ( 2.0h ) > and vertical stem -->
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1.5">
                <button
                  data-step-mins="-15"
                  data-block="${block.id}"
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F6] font-bold text-sm btn-tactile"
                  aria-label="Decrease 15m"
                >
                  ‹
                </button>
                <div class="w-8 h-8 rounded-full bg-[#F4F4F6] text-[#09090B] font-bold text-[11px] font-mono flex items-center justify-center">
                  ${(loggedMins / 60).toFixed(1)}h
                </div>
                <button
                  data-step-mins="15"
                  data-block="${block.id}"
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F6] font-bold text-sm btn-tactile"
                  aria-label="Increase 15m"
                >
                  ›
                </button>
              </div>
              <div class="w-[1.5px] h-2 bg-[#F4F4F6]"></div>
            </div>

            <!-- Row 2: Ruler Ticks + 8 Discrete Pastel Lime Capsule Pills (Reference 5) -->
            <div class="relative py-1">
              <!-- Background Ruler Ticks -->
              <div class="w-full h-3 ruler-ticks rounded-sm opacity-60"></div>

              <!-- Foreground Tappable Capsule Pills -->
              <div class="grid grid-cols-8 gap-1.5 mt-2">
                ${capsuleIntervals.map((minsVal, idx) => {
                  const isActive = loggedMins >= minsVal;
                  return `
                    <button
                      data-set-capsule="${minsVal}"
                      data-block="${block.id}"
                      class="h-3 rounded-full transition-all btn-tactile ${
                        isActive
                          ? 'bg-[#D9F99D]'
                          : 'bg-transparent border border-[#27272A] hover:border-[#3F3F46]'
                      }"
                      title="${(minsVal / 60).toFixed(1)}h"
                      aria-label="Set to ${(minsVal / 60).toFixed(1)} hours"
                    ></button>
                  `;
                }).join('')}
              </div>

              <!-- Time Scale Labels -->
              <div class="flex justify-between text-[10px] text-[#52525B] font-mono pt-1.5 px-0.5">
                <span>0h</span>
                <span>1h</span>
                <span>2h</span>
                <span>3h</span>
                <span>4h</span>
              </div>
            </div>
          </div>

          <!-- Row 3: Reference 5 Bottom Action Pill Bar -->
          <div class="p-3 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-between">
            <div>
              <div class="text-[10px] text-[#71717A] uppercase tracking-wide">Target floor</div>
              <div class="text-sm font-medium text-[#F4F4F6]">${(targetMins / 60).toFixed(1)} hrs / day</div>
            </div>

            <button
              data-timer-toggle="${block.id}"
              class="rounded-full px-5 py-2 text-xs font-semibold btn-tactile flex items-center gap-1.5"
              style="${
                isRunning
                  ? 'background-color: #FFD6D6; color: #B91C1C;'
                  : 'background-color: #F4F4F6; color: #09090B;'
              }"
              aria-label="${isRunning ? 'Stop Session' : 'Start Session'}"
            >
              <span>${isRunning ? 'Stop • <span data-live-sw>00:00</span>' : 'Start Session'}</span>
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
      if (e.target.closest('button, input, select, textarea, [data-manual-toggle], [data-timer-toggle], [data-set-capsule], [data-step-mins]')) {
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

  // Flat Circular Check Button Two-Way Toggle
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

  // Discrete Capsule Pill Selection (Reference 5)
  container.querySelectorAll('[data-set-capsule]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blockId = btn.getAttribute('data-block');
      const minsVal = Number(btn.getAttribute('data-set-capsule'));
      setDominoDuration(blockId, activeDateStr, minsVal);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Steppers (-15m / +15m)
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

  // Timer Toggle (Start / Stop)
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
}
