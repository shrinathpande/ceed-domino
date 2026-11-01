// src/views/dashboard.js
import {
  getState,
  getDayRecord,
  getBlocks,
  isDominoTask,
  setDominoDuration,
  toggleDominoComplete
} from '../core/state.js';
import { getTodayStr, getCampaignDayNumber, getExamCountdown, formatDateLocal } from '../utils/dates.js';
import { playRelayClick } from '../utils/sound.js';
import { renderStatusPill } from '../components/status-pill.js';
import {
  startLockScreenTimer,
  stopLockScreenTimer,
  getActiveTimerState
} from '../utils/lockscreen-timer.js';

let activeDateStr = getTodayStr();
let expandedBlockId = null;
let liveInterval = null;

function getWeekDays(centerDateStr) {
  const parts = centerDateStr.split('-');
  const base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dayOfWeek = base.getDay(); // 0 (Sun) - 6 (Sat)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  const todayStr = getTodayStr();
  const state = getState();
  const mandatoryBlocks = getBlocks().filter(isDominoTask);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return labels.map((label, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const iso = formatDateLocal(d);
    const dayRec = state.records?.[iso];
    const isComplete = dayRec && mandatoryBlocks.length > 0 && Array.isArray(dayRec.completed) && mandatoryBlocks.every(b => dayRec.completed.includes(b.id));

    return {
      label,
      dayNum: d.getDate(),
      dateStr: iso,
      isSelected: iso === centerDateStr,
      isToday: iso === todayStr,
      isComplete
    };
  });
}

export function renderDashboard(container, onSettings = null, targetDate = null) {
  if (targetDate && typeof targetDate === 'string') {
    activeDateStr = targetDate;
  }

  if (liveInterval) clearInterval(liveInterval);

  const todayStr = getTodayStr();
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
    const targetHrs = (b.targetMins || b.floor || 90) / 60;
    totalTargetHours += targetHrs;

    if (b.category === 'STUDY') studyHours += hrs;
    else workWalkHours += hrs;

    if (rec.completed.includes(b.id)) completedHours += hrs;
    else if (hrs > 0) inProgressHours += hrs;
  });

  const remainingHours = Math.max(0, totalTargetHours - completedHours - inProgressHours);
  const totalSpan = Math.max(totalTargetHours, completedHours + inProgressHours, 1);

  const solidFlex = Math.max(completedHours / totalSpan, completedHours > 0 ? 0.18 : 0.08);
  const hatchFlex = Math.max(inProgressHours / totalSpan, inProgressHours > 0 ? 0.16 : 0.14);
  const slateFlex = Math.max(remainingHours / totalSpan, 0.15);

  const isTodaySelected = activeDateStr === todayStr;

  container.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2 pb-28 select-none">
      
      <!-- 7-Day Circular Calendar Strip with Today Indicator -->
      <div class="mb-4">
        <div class="flex items-center justify-between px-1 mb-2">
          <div class="flex items-center gap-1.5 text-xs text-[#71717A]">
            <span class="w-2 h-2 rounded-full bg-[var(--domino-accent)]"></span>
            <span>Today: <strong class="text-[#F4F4F6] font-semibold">${todayStr}</strong></span>
          </div>
          ${!isTodaySelected ? `
            <button
              id="btn-jump-today"
              class="text-[11px] font-semibold text-[var(--domino-accent)] hover:underline btn-tactile"
            >
              Jump to Today →
            </button>
          ` : ''}
        </div>

        <div class="grid grid-cols-7 gap-1 px-1">
          ${weekDays.map(d => `
            <button
              type="button"
              data-date-pick="${d.dateStr}"
              class="flex flex-col items-center gap-1.5 py-1 btn-tactile focus:outline-none"
            >
              <span class="text-[11px] font-medium ${
                d.isSelected
                  ? 'text-[#F4F4F6] font-bold'
                  : (d.isToday ? 'text-[var(--domino-accent)] font-semibold' : 'text-[#71717A]')
              }">
                ${d.label}
              </span>
              <div class="w-[40px] h-[40px] rounded-full flex flex-col items-center justify-center text-[13px] font-medium tabular-nums relative transition-all ${
                d.isSelected
                  ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold'
                  : 'bg-[#141418] text-[#D4D4D8] border border-white/[0.08]'
              }">
                <span>${d.dayNum}</span>
                ${d.isToday && !d.isSelected ? `
                  <span class="w-1.5 h-1.5 rounded-full bg-[var(--domino-accent)] absolute bottom-1"></span>
                ` : ''}
                ${d.isComplete && !d.isSelected && !d.isToday ? `
                  <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute bottom-1"></span>
                ` : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Reference 7: Ron Design Scheduler Matte Slate Top Sheet -->
      <section class="ron-top-sheet mb-4">
        <div class="flex items-start justify-between gap-4 mb-5">
          <h1 class="text-[30px] font-medium tracking-tight text-[#F4F4F6] leading-none">
            Planning
          </h1>
          <div class="pl-4 border-l border-white/[0.1] text-right">
            <div class="text-[15px] font-medium text-[#F4F4F6] leading-tight">CEED Campaign</div>
            <div class="text-[12px] text-[#71717A] tabular-nums mt-0.5">
              Day ${dayNum} of 87 • ${countdown.days}d left
            </div>
          </div>
        </div>

        <!-- 3-Part Chunky Pill Bar (Solid White + Barcode Hatch + Matte Slate) -->
        <div class="flex items-center gap-1.5 h-[36px] mb-4">
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

        <!-- 3-Column Sub-Metrics with Micro-Glyph Prefixes -->
        <div class="grid grid-cols-3 gap-2 pt-1">
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Study logged</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-[#F4F4F6] mt-2"></span>
              <span class="text-[20px] font-medium text-[#F4F4F6] tabular-nums leading-none">${studyHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Work & fitness</div>
            <div class="flex items-start gap-1.5">
              <span class="text-[11px] font-mono text-[#A1A1AA] leading-none mt-1">'''</span>
              <span class="text-[20px] font-medium text-[#F4F4F6] tabular-nums leading-none">${workWalkHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11px] text-[#A1A1AA] mb-1">Dominos locked</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-[#71717A] mt-2"></span>
              <span class="text-[20px] font-medium text-[#F4F4F6] tabular-nums leading-none">${lockedCount} / ${mandatoryBlocks.length}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Domino Cards Stream -->
      <div class="space-y-3">
        ${blocks.map((block, index) => {
          const loggedMins = rec.durations?.[block.id] || 0;
          const loggedHrs = loggedMins / 60;
          const targetHrs = (block.targetMins || block.floor || 90) / 60;
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

          const pct = Math.min(100, Math.round((loggedMins / (targetMins || 60)) * 100));

          return `
            <div class="flex flex-col">
              <article
                data-card-id="${block.id}"
                role="button"
                tabindex="0"
                class="bento-card cursor-pointer transition-all ${isCompleted ? 'border-white/[0.18]' : ''} ${isRunningThis ? 'ring-1 ring-emerald-500/50' : ''}"
              >
                <!-- Card Face Header: Title First, Status Below -->
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <!-- Title First! -->
                    <h2 class="text-[16.5px] font-semibold text-[#F4F4F6] truncate">
                      ${index + 1}. ${block.name || block.title}
                    </h2>

                    <!-- Status Pill and Category Shoved BELOW Text! -->
                    <div class="flex items-center gap-2 mt-2">
                      ${renderStatusPill(pillState, true)}
                      <span class="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">
                        ${block.category || 'STUDY'}
                      </span>
                    </div>
                  </div>

                  <!-- Right Readout & Circular Check Toggle -->
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[13.5px] font-mono tabular-nums text-[#A1A1AA]">
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

                <!-- Subtle progress bar on card bottom -->
                <div class="w-full bg-[#1C1D22] h-1 rounded-full mt-3 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#A7F3D0]' : (isRunningThis ? 'bg-emerald-400' : 'bg-white/40')}"
                    style="width: ${pct}%;"
                  ></div>
                </div>

                ${isExpanded ? `
                  <!-- Expanded Tactile Time Adjuster Slider Drawer -->
                  <div class="mt-5 pt-4 border-t border-white/[0.06]" data-drawer-stop>
                    
                    <!-- Hero Slider Header & Quick Step -->
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-medium text-[#71717A]">Log Session Hours</span>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          data-step-mins="-15"
                          data-block-id="${block.id}"
                          class="w-7 h-7 rounded-full bg-[#18191E] border border-white/[0.08] text-[#D4D4D8] flex items-center justify-center text-sm font-bold btn-tactile"
                          title="Decrease 15m"
                        >–</button>
                        <span class="text-[17px] font-mono font-bold text-[#F4F4F6] tabular-nums px-2 py-0.5 rounded-lg bg-[#18191E] border border-white/[0.08]">
                          ${loggedHrs.toFixed(2)}h
                        </span>
                        <button
                          type="button"
                          data-step-mins="15"
                          data-block-id="${block.id}"
                          class="w-7 h-7 rounded-full bg-[#18191E] border border-white/[0.08] text-[#D4D4D8] flex items-center justify-center text-sm font-bold btn-tactile"
                          title="Increase 15m"
                        >+</button>
                      </div>
                    </div>

                    <!-- Fluid Tactile Range Slider -->
                    <div class="py-2">
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.25"
                        value="${loggedHrs}"
                        data-slider-block="${block.id}"
                        class="w-full h-2.5 bg-[#1C1D22] rounded-lg appearance-none cursor-pointer accent-[#C8F560]"
                        style="background: linear-gradient(to right, #C8F560 0%, #C8F560 ${(loggedHrs / 6) * 100}%, #1C1D22 ${(loggedHrs / 6) * 100}%, #1C1D22 100%);"
                      />
                      <div class="flex justify-between text-[11px] font-mono text-[#71717A] mt-1.5">
                        <span>0.0h</span>
                        <span>1.5h</span>
                        <span>3.0h</span>
                        <span>4.5h</span>
                        <span>6.0h</span>
                      </div>
                    </div>

                    <!-- Quick Preset Chips -->
                    <div class="flex items-center gap-1.5 my-3 overflow-x-auto py-1">
                      <button
                        type="button"
                        data-set-mins="0"
                        data-block-id="${block.id}"
                        class="px-2.5 py-1 rounded-full bg-[#18191E] border border-white/[0.08] text-[11px] font-medium text-[#A1A1AA] hover:text-white btn-tactile whitespace-nowrap"
                      >
                        Reset (0h)
                      </button>
                      <button
                        type="button"
                        data-set-mins="${targetMins}"
                        data-block-id="${block.id}"
                        class="px-2.5 py-1 rounded-full bg-[#18191E] border border-white/[0.08] text-[11px] font-medium text-[#C8F560] hover:text-white btn-tactile whitespace-nowrap"
                      >
                        Target (${targetHrs.toFixed(1)}h)
                      </button>
                      <button
                        type="button"
                        data-step-mins="30"
                        data-block-id="${block.id}"
                        class="px-2.5 py-1 rounded-full bg-[#18191E] border border-white/[0.08] text-[11px] font-medium text-[#A1A1AA] hover:text-white btn-tactile whitespace-nowrap"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        data-step-mins="60"
                        data-block-id="${block.id}"
                        class="px-2.5 py-1 rounded-full bg-[#18191E] border border-white/[0.08] text-[11px] font-medium text-[#A1A1AA] hover:text-white btn-tactile whitespace-nowrap"
                      >
                        +1.0h
                      </button>
                      <button
                        type="button"
                        data-set-mins="240"
                        data-block-id="${block.id}"
                        class="px-2.5 py-1 rounded-full bg-[#18191E] border border-white/[0.08] text-[11px] font-medium text-[#A1A1AA] hover:text-white btn-tactile whitespace-nowrap"
                      >
                        Max (4h)
                      </button>
                    </div>

                    <!-- Recessed Bottom Well with Target Floor & Session Trigger -->
                    <div class="recessed-well mt-2 flex items-center justify-between gap-3">
                      <div>
                        <div class="text-[11px] text-[#71717A]">Target Floor</div>
                        <div class="text-[15px] font-semibold text-[#F4F4F6] tabular-nums mt-0.5">
                          ${targetHrs.toFixed(1)} <span class="text-[12px] text-[#71717A] font-normal">hrs / day</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        data-timer-toggle="${block.id}"
                        class="px-5 py-2.5 rounded-full text-[13px] font-semibold tracking-tight btn-tactile ${
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

              <!-- Dedicated Live Session Timer Box Directly Below Card when Running! -->
              ${isRunningThis ? `
                <div class="mt-1.5 p-3 rounded-[20px] bg-[#16171B] border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <div>
                      <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ACTIVE DRILL RUNNING</div>
                      <div class="text-[20px] font-mono font-bold text-[#F4F4F6] tabular-nums leading-tight">
                        <span id="live-timer-digits-${block.id}">${timerState.formatted || '00:00'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-quick-stop="${block.id}"
                    class="px-4 py-2 rounded-full bg-[#FECACA] text-[#991B1B] border border-[#F87171] text-xs font-semibold btn-tactile flex items-center gap-1.5"
                  >
                    <span>⏹ Stop & Log</span>
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindDashboardEvents(container);

  if (timerState.running) {
    liveInterval = setInterval(() => {
      const currentTimerState = getActiveTimerState();
      if (!currentTimerState.running) {
        clearInterval(liveInterval);
        renderDashboard(container);
        return;
      }
      const digitsEl = container.querySelector(`#live-timer-digits-${currentTimerState.blockId}`);
      if (digitsEl) {
        digitsEl.textContent = currentTimerState.formatted || '00:00';
      }
    }, 1000);
  }
}

function bindDashboardEvents(container) {
  // Jump to Today button
  container.querySelector('#btn-jump-today')?.addEventListener('click', () => {
    activeDateStr = getTodayStr();
    playRelayClick();
    renderDashboard(container);
  });

  // Date Strip selection
  container.querySelectorAll('[data-date-pick]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      activeDateStr = btn.dataset.datePick;
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Card body expansion (clicking outside interactive elements)
  container.querySelectorAll('[data-card-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
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

  // Fluid Range Slider input
  container.querySelectorAll('[data-slider-block]').forEach(slider => {
    slider.addEventListener('input', e => {
      const blockId = slider.dataset.sliderBlock;
      const hours = parseFloat(e.target.value);
      const mins = Math.round(hours * 60);
      setDominoDuration(blockId, activeDateStr, mins);
      slider.style.background = `linear-gradient(to right, #C8F560 0%, #C8F560 ${(hours / 6) * 100}%, #1C1D22 ${(hours / 6) * 100}%, #1C1D22 100%)`;
    });
    slider.addEventListener('change', () => {
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Quick preset chips
  container.querySelectorAll('[data-set-mins]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.blockId;
      const mins = parseInt(btn.dataset.setMins, 10);
      setDominoDuration(blockId, activeDateStr, mins);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Step minutes (-15m / +15m / +30m / +60m)
  container.querySelectorAll('[data-step-mins]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.blockId;
      const delta = parseInt(btn.dataset.stepMins, 10);
      const rec = getDayRecord(activeDateStr);
      const current = rec.durations?.[blockId] || 0;
      const nextMins = Math.min(360, Math.max(0, current + delta));
      setDominoDuration(blockId, activeDateStr, nextMins);
      playRelayClick();
      renderDashboard(container);
    });
  });

  // Start / Stop Session Timer (drawer button)
  container.querySelectorAll('[data-timer-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.timerToggle;
      handleToggleTimer(blockId, container);
    });
  });

  // Quick Stop & Log (dedicated button below closed card)
  container.querySelectorAll('[data-quick-stop]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const blockId = btn.dataset.quickStop;
      handleToggleTimer(blockId, container);
    });
  });
}

function handleToggleTimer(blockId, container) {
  const timerState = getActiveTimerState();
  if (timerState.running && timerState.blockId === blockId) {
    const elapsedMins = stopLockScreenTimer();
    if (elapsedMins > 0) {
      const rec = getDayRecord(activeDateStr);
      const current = rec.durations?.[blockId] || 0;
      setDominoDuration(blockId, activeDateStr, current + elapsedMins);
    }
  } else {
    if (timerState.running) {
      stopLockScreenTimer();
    }
    const block = getBlocks().find(b => b.id === blockId);
    startLockScreenTimer(blockId, block?.name || 'Domino Session', () => {
      renderDashboard(container);
    });
  }
  playRelayClick();
  renderDashboard(container);
}
