import {
  getState,
  getDayRecord,
  getBlocks,
  isDominoTask,
  setDominoDuration,
  toggleDominoComplete
} from '../core/state.js';
import { getTodayStr, getCampaignDayNumber, getExamCountdown } from '../utils/dates.js';
import { playRelayClick } from '../utils/sound.js';
import { renderStatusPill } from '../components/status-pill.js';
import {
  startLockScreenTimer,
  stopLockScreenTimer,
  getActiveTimerState
} from '../utils/lockscreen-timer.js';

let activeDateStr = getTodayStr();
let expandedBlockId = null;

function getWeekDays(centerDateStr) {
  const base = new Date(centerDateStr + 'T00:00:00');
  const dayOfWeek = base.getDay(); // 0 (Sun) - 6 (Sat)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const iso = d.toISOString().slice(0, 10);
    return {
      label,
      dayNum: d.getDate(),
      dateStr: iso,
      isSelected: iso === centerDateStr
    };
  });
}

export function renderDashboard(container) {
  const state = getState();
  const blocks = getBlocks();
  const rec = getDayRecord(activeDateStr);
  const weekDays = getWeekDays(activeDateStr);
  const dayNum = getCampaignDayNumber(activeDateStr);
  const countdown = getExamCountdown();
  const timerState = getActiveTimerState();

  const mandatoryBlocks = blocks.filter(isDominoTask);
  const lockedCount = mandatoryBlocks.filter(b => rec.completed.includes(b.id)).length;

  let studyHours = 0;
  let workWalkHours = 0;
  let completedHours = 0;
  let inProgressHours = 0;
  let totalTargetHours = 0;

  blocks.forEach(b => {
    const mins = rec.durations?.[b.id] || 0;
    const hrs = mins / 60;
    const targetHrs = b.targetHours || (b.floor ? b.floor / 60 : 1.5);
    totalTargetHours += targetHrs;

    if (b.category === 'STUDY') studyHours += hrs;
    else workWalkHours += hrs;

    if (rec.completed.includes(b.id)) completedHours += hrs;
    else if (hrs > 0) inProgressHours += hrs;
  });

  const remainingHours = Math.max(0, totalTargetHours - completedHours - inProgressHours);
  const totalSpan = Math.max(totalTargetHours, completedHours + inProgressHours, 1);

  // Reference 7: Keep all 3 visual textures optically present so the bar always looks like a hardware gauge
  const solidFlex = Math.max(completedHours / totalSpan, completedHours > 0 ? 0.18 : 0.08);
  const hatchFlex = Math.max(inProgressHours / totalSpan, inProgressHours > 0 ? 0.16 : 0.14);
  const slateFlex = Math.max(remainingHours / totalSpan, 0.15);

  container.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2 pb-28 select-none">
      
      <!-- Reference 8: 7-Day Circular Calendar Strip -->
      <div class="grid grid-cols-7 gap-1 mb-4 px-1">
        ${weekDays.map(d => `
          <button
            type="button"
            data-date-pick="${d.dateStr}"
            class="flex flex-col items-center gap-2 py-1 btn-tactile"
          >
            <span class="text-[12px] font-medium ${d.isSelected ? 'text-[#F4F4F6] font-semibold' : 'text-[#71717A]'}">${d.label}</span>
            <span class="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] tabular-nums transition-colors ${
              d.isSelected
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold'
                : 'bg-[#141418] text-[#D4D4D8] border border-white/[0.06]'
            }">
              ${d.dayNum}
            </span>
          </button>
        `).join('')}
      </div>

      <!-- Reference 7: Ron Design Scheduler Matte Slate Top Sheet -->
      <section class="ron-top-sheet mb-4">
        <div class="flex items-start justify-between gap-4 mb-5">
          <h1 class="text-[32px] font-normal tracking-[-0.03em] text-[#F4F4F6] leading-none">
            Planning
          </h1>
          <div class="pl-4 border-l border-white/[0.1] text-right">
            <div class="text-[15px] font-medium text-[#F4F4F6] leading-tight">CEED Campaign</div>
            <div class="text-[12px] text-[#71717A] tabular-nums mt-0.5">
              Day ${dayNum} of 87 • ${countdown.days}d left
            </div>
          </div>
        </div>

        <!-- Reference 7: 3-Part Chunky Pill Bar (Solid White + Barcode Hatch + Matte Slate) -->
        <div class="flex items-center gap-1.5 h-[38px] mb-5">
          <div
            style="flex: ${solidFlex}"
            class="h-full bg-[#F4F4F6] rounded-[11px] transition-all duration-300"
            title="Completed Hours"
          ></div>
          <div
            style="flex: ${hatchFlex}"
            class="h-full bg-barcode-hatch rounded-[9px] transition-all duration-300"
            title="In-Progress / Queued Hours"
          ></div>
          <div
            style="flex: ${slateFlex}"
            class="h-full bg-[#52525B]/60 rounded-[11px] transition-all duration-300"
            title="Remaining Target Floor"
          ></div>
        </div>

        <!-- Reference 7: 3-Column Sub-Metrics with Micro-Glyph Prefixes -->
        <div class="grid grid-cols-3 gap-2 pt-1">
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Study logged</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-[#F4F4F6] mt-2"></span>
              <span class="text-[21px] font-medium text-[#F4F4F6] tabular-nums leading-none">${studyHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Work & fitness</div>
            <div class="flex items-start gap-1.5">
              <span class="text-[11px] font-mono text-[#A1A1AA] leading-none mt-1">'''</span>
              <span class="text-[21px] font-medium text-[#F4F4F6] tabular-nums leading-none">${workWalkHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Dominos locked</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-[#71717A] mt-2"></span>
              <span class="text-[21px] font-medium text-[#F4F4F6] tabular-nums leading-none">${lockedCount} / ${mandatoryBlocks.length}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Domino Cards Stream -->
      <div class="space-y-3">
        ${blocks.map((block, index) => {
          const loggedMins = rec.durations?.[block.id] || 0;
          const loggedHrs = loggedMins / 60;
          const targetHrs = block.targetHours || (block.floor ? block.floor / 60 : 1.5);
          const targetMins = Math.round(targetHrs * 60);
          const isCompleted = rec.completed.includes(block.id);
          const isExpanded = expandedBlockId === block.id;
          const isRunningThis = timerState.running && timerState.blockId === block.id;
          const isMandatory = isDominoTask(block);

          let pillState = 'PENDING';
          if (!isMandatory && loggedMins === 0) pillState = 'ROUTINE';
          else if (isRunningThis || (loggedMins > 0 && !isCompleted)) pillState = 'IN_PROGRESS';
          else if (isCompleted && loggedMins < targetMins) pillState = 'UNDER_FLOOR';
          else if (isCompleted) pillState = 'COMPLETED';

          // 8 discrete 30-min slots up to 4.0h for the integrated ruler + lime capsule track
          const totalSlots = 8;
          const activeSlots = Math.min(totalSlots, Math.round(loggedHrs / 0.5));
          const pinPercent = Math.min(92, Math.max(8, (loggedHrs / 4.0) * 100));

          return `
            <article
              data-card-id="${block.id}"
              role="button"
              tabindex="0"
              class="bento-card cursor-pointer ${isCompleted ? 'border-white/[0.15]' : ''}"
            >
              <!-- Card Face Header -->
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2.5 mb-2">
                    ${renderStatusPill(pillState)}
                    <span class="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717A]">
                      ${block.category || 'STUDY'}
                    </span>
                  </div>
                  <h2 class="text-[17px] font-medium text-[#F4F4F6] truncate">
                    ${index + 1}. ${block.title || block.name}
                  </h2>
                </div>

                <!-- Right Readout & Circular Check Toggle -->
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-[14px] font-mono tabular-nums text-[#A1A1AA]">
                    <strong class="text-[#F4F4F6] font-semibold">${loggedHrs.toFixed(1)}</strong> / ${targetHrs.toFixed(1)}h
                  </span>

                  <button
                    type="button"
                    data-manual-toggle="${block.id}"
                    aria-label="Toggle Complete"
                    class="w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all btn-tactile ${
                      isCompleted
                        ? 'bg-[#A7F3D0] text-[#064E3B] border border-[#4ADE80]'
                        : 'bg-[#18191E] text-[#71717A] border border-white/[0.1]'
                    }"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              ${isExpanded ? `
                <!-- Reference 7: Expanded Ruler-Pill Drawer -->
                <div class="mt-6 pt-4 border-t border-white/[0.06]" data-drawer-stop>
                  
                  <!-- White Pin Callout + Vertical Stem Dropping into Lime Capsule Track -->
                  <div class="relative pt-12 pb-2 px-1">
                    
                    <!-- Floating Pin Callout (< 1.5h >) -->
                    <div
                      style="left: ${pinPercent}%;"
                      class="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-200"
                    >
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          data-step-mins="-30"
                          data-block-id="${block.id}"
                          class="w-6 h-6 rounded-full flex items-center justify-center text-[#71717A] hover:text-white btn-tactile"
                        >‹</button>
                        <div class="w-[38px] h-[38px] rounded-full bg-[#F4F4F6] text-[#09090B] font-semibold text-[13px] tabular-nums flex items-center justify-center shadow-md">
                          ${loggedHrs.toFixed(1)}h
                        </div>
                        <button
                          type="button"
                          data-step-mins="30"
                          data-block-id="${block.id}"
                          class="w-6 h-6 rounded-full flex items-center justify-center text-[#71717A] hover:text-white btn-tactile"
                        >›</button>
                      </div>
                      <!-- Vertical Stem connecting pin to capsule track -->
                      <div class="w-[2px] h-4 bg-[#C8F560]"></div>
                    </div>

                    <!-- Integrated Ruler Ticks + Lime Capsules on the SAME Horizontal Track -->
                    <div class="grid grid-cols-8 gap-1.5 items-center h-[18px]">
                      ${Array.from({ length: totalSlots }).map((_, slotIdx) => {
                        const isFilled = slotIdx < activeSlots;
                        const slotMinutes = (slotIdx + 1) * 30;
                        return `
                          <button
                            type="button"
                            data-slot-mins="${slotMinutes}"
                            data-block-id="${block.id}"
                            class="h-[16px] rounded-full transition-all btn-tactile ${
                              isFilled
                                ? 'bg-[#C8F560]'
                                : 'ruler-slot-ticks opacity-75 hover:opacity-100'
                            }"
                            title="Set ${(slotMinutes / 60).toFixed(1)}h"
                          ></button>
                        `;
                      }).join('')}
                    </div>

                    <!-- Time Axis Labels -->
                    <div class="flex justify-between text-[11px] font-mono tabular-nums text-[#71717A] mt-2.5 px-0.5">
                      <span>0h</span>
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                    </div>
                  </div>

                  <!-- Reference 7: Recessed Bottom Well with Target Floor & Solid White Pill CTA -->
                  <div class="recessed-well mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div class="text-[11px] text-[#71717A]">Target floor</div>
                      <div class="text-[16px] font-medium text-[#F4F4F6] tabular-nums mt-0.5">
                        ${targetHrs.toFixed(1)} <span class="text-[12px] text-[#71717A] font-normal">hrs / day</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-timer-toggle="${block.id}"
                      class="px-5 py-2.5 rounded-full text-[13px] font-semibold tracking-[-0.01em] btn-tactile ${
                        isRunningThis
                          ? 'bg-[#FECACA] text-[#991B1B] border border-[#F87171]'
                          : 'bg-[#F4F4F6] text-[#09090B]'
                      }"
                    >
                      ${isRunningThis ? `Stop • ${timerState.formatted || '00:00'}` : 'Start Session'}
                    </button>
                  </div>

                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindDashboardEvents(container);
}

function bindDashboardEvents(container) {
  // Date Strip selection
  container.querySelectorAll('[data-date-pick]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      activeDateStr = btn.dataset.datePick;
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Card body expansion
  container.querySelectorAll('[data-card-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.cardId;
      expandedBlockId = expandedBlockId === id ? null : id;
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Prevent clicks inside drawer from collapsing the card
  container.querySelectorAll('[data-drawer-stop]').forEach(el => {
    el.addEventListener('click', e => e.stopPropagation());
  });

  // Two-way manual check button
  container.querySelectorAll('[data-manual-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const blockId = btn.dataset.manualToggle;
      toggleDominoComplete(blockId, activeDateStr);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Direct capsule slot click
  container.querySelectorAll('[data-slot-mins]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.blockId;
      const mins = parseInt(btn.dataset.slotMins, 10);
      const rec = getDayRecord(activeDateStr);
      const current = rec.durations?.[blockId] || 0;
      const nextMins = current === mins ? Math.max(0, mins - 30) : mins;
      setDominoDuration(blockId, activeDateStr, nextMins);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Pin stepper (< / >)
  container.querySelectorAll('[data-step-mins]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.blockId;
      const delta = parseInt(btn.dataset.stepMins, 10);
      const rec = getDayRecord(activeDateStr);
      const current = rec.durations?.[blockId] || 0;
      const nextMins = Math.min(240, Math.max(0, current + delta));
      setDominoDuration(blockId, activeDateStr, nextMins);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Start / Stop Lock-Screen Session Timer
  container.querySelectorAll('[data-timer-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.timerToggle;
      const timerState = getActiveTimerState();
      if (timerState.running && timerState.blockId === blockId) {
        const elapsedMins = stopLockScreenTimer();
        if (elapsedMins > 0) {
          const rec = getDayRecord(activeDateStr);
          const current = rec.durations?.[blockId] || 0;
          setDominoDuration(blockId, activeDateStr, current + elapsedMins);
        }
      } else {
        const block = getBlocks().find(b => b.id === blockId);
        startLockScreenTimer(blockId, block?.title || 'Domino Session', () => {
          renderDashboard(container);
        });
      }
      playRelayClick();
      renderDashboard(container);
    });
  });
}