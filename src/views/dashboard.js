// src/views/dashboard.js
import {
  getState,
  getDayRecord,
  getBlocks,
  saveBlocks,
  DEFAULT_BLOCKS,
  isDominoTask,
  setDominoDuration,
  toggleDominoComplete,
  getCardInfusionScope
} from '../core/state.js';
import { getTodayStr, getCampaignDayNumber, getExamCountdown, formatDateLocal } from '../utils/dates.js';
import { playRelayClick, playVictoryChime } from '../utils/sound.js';
import { renderStatusPill } from '../components/status-pill.js';
import { showExamToast } from '../components/header.js';
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
  const isCardsInfused = getCardInfusionScope() === 'all';

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

  const isAllLocked = lockedCount === mandatoryBlocks.length && mandatoryBlocks.length > 0;
  const isTodaySelected = activeDateStr === todayStr;

  container.innerHTML = `
    <div class="max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-6 select-none">
      
      <!-- 7-Day Circular Calendar Strip with Today Indicator -->
      <div class="mb-4 stagger-item stagger-delay-1">
        <div class="flex items-center justify-between px-1 mb-2">
          <div class="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
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

      <!-- Planning Hero Card - Full Soft Pastel Accent Infusion -->
      <section class="ron-top-sheet mb-4 stagger-item stagger-delay-2">
        <div class="flex items-start justify-between gap-4 mb-5">
          <h1 class="text-2xl sm:text-[28px] font-bold tracking-tight text-[#09090B] leading-none">
            Planning
          </h1>
          <div class="pl-4 border-l border-black/20 text-right">
            <div class="text-[15px] font-bold text-[#09090B] leading-tight">CEED Campaign</div>
            <button
              type="button"
              id="btn-hero-countdown"
              class="text-[12px] text-black/70 hover:text-black font-semibold tabular-nums mt-0.5 transition-colors cursor-pointer text-right block ml-auto"
              title="Tap for exact CEED exam timing & countdown"
            >
              Day ${dayNum} of 87 • ${countdown.days}d left
            </button>
          </div>
        </div>

        <!-- 3-Part Chunky Pill Bar (Solid Ink + Dark Barcode Hatch + Translucent Ink Well) -->
        <div class="flex items-center gap-1.5 h-[36px] mb-4">
          <div
            style="flex: ${solidFlex}"
            class="h-full bg-[#09090B] rounded-[9px] transition-all duration-300 shadow-sm"
            title="Completed Hours"
          ></div>
          <div
            style="flex: ${hatchFlex}"
            class="h-full bg-barcode-hatch-dark rounded-[9px] transition-all duration-300"
            title="In-Progress / Queued Hours"
          ></div>
          <div
            style="flex: ${slateFlex}"
            class="h-full bg-black/15 rounded-[9px] transition-all duration-300"
            title="Remaining Target Floor"
          ></div>
        </div>

        <!-- 3-Column Sub-Metrics with Deep Ink Typography -->
        <div class="grid grid-cols-3 gap-2 pt-1">
          <div>
            <div class="text-[11.5px] font-semibold text-black/70 mb-1">Study logged</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-[#09090B] mt-2"></span>
              <span class="text-[20px] font-bold text-[#09090B] tabular-nums leading-none">${studyHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11.5px] font-semibold text-black/70 mb-1">Work & fitness</div>
            <div class="flex items-start gap-1.5">
              <span class="text-[11px] font-mono text-black/70 font-bold leading-none mt-1">'''</span>
              <span class="text-[20px] font-bold text-[#09090B] tabular-nums leading-none">${workWalkHours.toFixed(1)}h</span>
            </div>
          </div>
          <div>
            <div class="text-[11.5px] font-semibold text-black/70 mb-1">Dominos locked</div>
            <div class="flex items-start gap-1.5">
              <span class="w-2.5 h-[3px] rounded-full bg-black/40 mt-2"></span>
              <span class="text-[20px] font-bold text-[#09090B] tabular-nums leading-none">${lockedCount} / ${mandatoryBlocks.length}</span>
            </div>
          </div>
        </div>

        ${isAllLocked ? `
          <div
            id="btn-replay-celebration"
            class="mt-3.5 py-2 px-3.5 rounded-full bg-[#09090B] text-white flex items-center justify-between cursor-pointer btn-tactile hover:bg-black/90 transition-transform select-none"
            title="Tap to replay 100% Domino Celebration"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[var(--domino-accent)]"></span>
              <span class="text-[12px] font-bold tracking-tight">${mandatoryBlocks.length}/${mandatoryBlocks.length} Dominos Locked • Day Complete</span>
            </div>
            <span class="text-[11px] font-medium text-white/70">Replay Celebration</span>
          </div>
        ` : ''}
      </section>

      <!-- Domino Cards Stream -->
      <div class="space-y-3">
        ${blocks.length === 0 ? `
          <div class="bento-card text-center py-10 px-6 stagger-item stagger-delay-3 flex flex-col items-center justify-center select-none">
            <div class="w-12 h-12 rounded-full bg-[var(--surface-well)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 text-[var(--domino-accent)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-[var(--text-primary)] mb-1">No Domino Pillars Configured</h3>
            <p class="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-4">You have zero active study pillars in your circadian schedule. Configure custom blocks or restore defaults to start logging.</p>
            <div class="flex items-center gap-2">
              <a href="#/settings" class="px-4 py-2 rounded-full text-xs font-bold bg-[var(--domino-accent)] text-[#09090B] btn-tactile shadow-sm">
                Open Settings
              </a>
              <button id="btn-empty-restore-defaults" type="button" class="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:text-white btn-tactile">
                Restore Defaults
              </button>
            </div>
          </div>
        ` : blocks.map((block, index) => {
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
            <div class="flex flex-col stagger-item stagger-delay-${Math.min(index + 3, 8)}">
              <article
                data-card-id="${block.id}"
                role="button"
                tabindex="0"
                class="bento-card ${isCardsInfused ? 'card-infused' : ''} cursor-pointer transition-all select-none min-h-[56px] ${isCompleted ? (isCardsInfused ? 'border-black/25' : 'border-white/[0.18]') : ''} ${isRunningThis ? (isCardsInfused ? 'ring-2 ring-black/40 timer-running-glow' : 'ring-1 ring-emerald-500/50 timer-running-glow') : ''}"
                style="touch-action: manipulation;"
              >
                <!-- Card Face Header: Title First, Status Below -->
                <div class="flex items-center justify-between gap-2.5">
                  <div class="min-w-0 flex-1">
                    <!-- Title First! 2-line clamp with title attribute -->
                    <h2
                      class="text-[16px] sm:text-[16.5px] font-bold ${isCardsInfused ? 'text-[#09090B]' : 'text-[#F4F4F6]'} line-clamp-2 leading-snug"
                      title="${(block.name || block.title || '').replace(/"/g, '&quot;')}"
                      style="overflow-wrap: anywhere; word-break: break-word;"
                    >
                      ${index + 1}. ${block.name || block.title}
                    </h2>

                    <!-- Status Pill and Category Shoved BELOW Text! -->
                    <div class="flex items-center gap-1.5 sm:gap-2 mt-2 min-w-0 flex-wrap">
                      ${renderStatusPill(pillState, true)}
                      <span
                        class="text-[11.5px] sm:text-[12px] font-medium capitalize truncate ${isCardsInfused ? 'text-black/60' : 'text-[#A1A1AA]'}"
                        title="${(block.category || 'Study').toLowerCase()}"
                        style="max-width: min(200px, calc(100vw - 190px));"
                      >
                        ${(block.category || 'Study').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <!-- Right Readout & Circular Check Toggle (Ergonomic 44x44 Touch Target) -->
                  <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span class="text-[13px] sm:text-[13.5px] font-mono tabular-nums ${isCardsInfused ? 'text-black/80' : 'text-[#A1A1AA]'}">
                      <strong class="${isCardsInfused ? 'text-[#09090B] font-bold' : 'text-[#F4F4F6] font-semibold'}">${loggedHrs.toFixed(1)}</strong> / ${targetHrs.toFixed(1)}h
                    </span>

                    <button
                      type="button"
                      data-manual-toggle="${block.id}"
                      aria-label="${isCompleted ? 'Mark ' + (block.name || 'pillar') + ' incomplete' : 'Mark ' + (block.name || 'pillar') + ' complete'}"
                      class="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all btn-tactile shrink-0 ${
                        isCardsInfused
                          ? (isCompleted
                              ? 'bg-[#09090B] text-white border border-[#09090B] font-bold shadow-md'
                              : 'bg-transparent text-black/70 border border-black/25 hover:bg-black/5')
                          : (isCompleted
                              ? 'bg-[var(--domino-accent)] text-[#09090B] border border-[var(--domino-accent)] font-bold shadow-sm'
                              : 'bg-transparent text-[#71717A] border border-white/20 hover:border-white/40')
                      }"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${isCompleted ? 'check-pop-enter' : ''}">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Subtle progress bar on card bottom -->
                <div class="w-full ${isCardsInfused ? 'bg-black/15' : 'bg-[#1C1D22]'} h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300 ${
                      isCardsInfused
                        ? 'bg-[#09090B]'
                        : (isCompleted ? 'bg-[var(--domino-accent)]' : (isRunningThis ? 'bg-[var(--domino-accent)]' : 'bg-white/40'))
                    }"
                    style="width: ${pct}%;"
                  ></div>
                </div>

                <!-- Expanded Tactile Time Adjuster Slider Drawer (Emil Kowalski Accordion Transition) -->
                <div data-drawer-wrapper class="accordion-wrapper ${isExpanded ? 'is-open' : ''}">
                  <div class="accordion-inner">
                    <div class="mt-5 pt-4 ${isCardsInfused ? 'border-t border-black/15' : 'border-t border-white/[0.06]'}" data-drawer-stop>
                      
                      <!-- Hero Slider Header & Quick Step -->
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold ${isCardsInfused ? 'text-black/70' : 'text-[var(--text-muted)]'}">Log Session Hours</span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            data-step-mins="-15"
                            data-block-id="${block.id}"
                            class="w-7 h-7 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-[#09090B] hover:bg-black/20' : 'bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[#D4D4D8]'} flex items-center justify-center text-sm font-bold btn-tactile"
                            title="Decrease 15m"
                            aria-label="Decrease logged duration by 15 minutes"
                          >–</button>
                          <span class="text-[17px] font-mono font-bold ${isCardsInfused ? 'text-[#09090B] bg-black/10 border border-black/20' : 'text-[#F4F4F6] bg-[var(--surface-well)] border border-[var(--border-subtle)]'} tabular-nums px-2 py-0.5 rounded-lg">
                            ${loggedHrs.toFixed(2)}h
                          </span>
                          <button
                            type="button"
                            data-step-mins="15"
                            data-block-id="${block.id}"
                            class="w-7 h-7 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-[#09090B] hover:bg-black/20' : 'bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[#D4D4D8]'} flex items-center justify-center text-sm font-bold btn-tactile"
                            title="Increase 15m"
                            aria-label="Increase logged duration by 15 minutes"
                          >+</button>
                        </div>
                      </div>

                      <!-- Fluid Tactile Range Slider with Safe Pan-X Touch Capture -->
                      <div class="py-2" style="touch-action: pan-x;">
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="0.25"
                          value="${loggedHrs}"
                          data-slider-block="${block.id}"
                          aria-label="Logged session hours for ${block.name || 'Pillar'}: ${loggedHrs.toFixed(2)} hours"
                          class="w-full h-2.5 rounded-lg appearance-none cursor-pointer ${isCardsInfused ? 'bg-black/15 accent-[#09090B]' : 'bg-[#1C1D22] accent-[var(--domino-accent)]'}"
                          style="${
                            isCardsInfused
                              ? `background: linear-gradient(to right, #09090B 0%, #09090B ${(loggedHrs / 6) * 100}%, rgba(0,0,0,0.18) ${(loggedHrs / 6) * 100}%, rgba(0,0,0,0.18) 100%); /* taste-skill-ignore */`
                              : `background: linear-gradient(to right, var(--domino-accent) 0%, var(--domino-accent) ${(loggedHrs / 6) * 100}%, var(--surface-well) ${(loggedHrs / 6) * 100}%, var(--surface-well) 100%); /* taste-skill-ignore */`
                          }"
                        />
                        <div class="flex justify-between text-[11px] font-mono ${isCardsInfused ? 'text-black/70' : 'text-[var(--text-muted)]'} mt-1.5">
                          <span>0.0h</span>
                          <span>1.5h</span>
                          <span>3.0h</span>
                          <span>4.5h</span>
                          <span>6.0h</span>
                        </div>
                      </div>

                      <!-- Quick Preset Chips with Flex-Wrap -->
                      <div class="flex items-center gap-1.5 my-3 flex-wrap py-1">
                        <button
                          type="button"
                          data-set-mins="0"
                          data-block-id="${block.id}"
                          aria-label="Reset logged duration to 0 hours"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          Reset (0h)
                        </button>
                        <button
                          type="button"
                          data-set-mins="${targetMins}"
                          data-block-id="${block.id}"
                          aria-label="Set logged duration to daily target floor (${targetHrs.toFixed(1)}h)"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/20 border border-black/30 text-[#09090B] font-bold' : 'bg-[#18191E] border border-[var(--domino-accent)]/40 text-[var(--domino-accent)] hover:text-white font-semibold'} text-[11px] btn-tactile whitespace-nowrap"
                        >
                          Target (${targetHrs.toFixed(1)}h)
                        </button>
                        <button
                          type="button"
                          data-step-mins="30"
                          data-block-id="${block.id}"
                          aria-label="Add 30 minutes to logged duration"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          +30m
                        </button>
                        <button
                          type="button"
                          data-step-mins="60"
                          data-block-id="${block.id}"
                          aria-label="Add 1 hour to logged duration"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          +1.0h
                        </button>
                        <button
                          type="button"
                          data-set-mins="240"
                          data-block-id="${block.id}"
                          aria-label="Set logged duration to maximum 4 hours"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          Max (4h)
                        </button>
                      </div>
                        <button
                          type="button"
                          data-set-mins="0"
                          data-block-id="${block.id}"
                          aria-label="Reset logged duration to 0 hours"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          Reset (0h)
                        </button>
                        <button
                          type="button"
                          data-set-mins="${targetMins}"
                          data-block-id="${block.id}"
                          aria-label="Set logged duration to daily target floor (${targetHrs.toFixed(1)}h)"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/20 border border-black/30 text-[#09090B] font-bold' : 'bg-[#18191E] border border-[var(--domino-accent)]/40 text-[var(--domino-accent)] hover:text-white font-semibold'} text-[11px] btn-tactile whitespace-nowrap"
                        >
                          Target (${targetHrs.toFixed(1)}h)
                        </button>
                        <button
                          type="button"
                          data-step-mins="30"
                          data-block-id="${block.id}"
                          aria-label="Add 30 minutes to logged duration"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          +30m
                        </button>
                        <button
                          type="button"
                          data-step-mins="60"
                          data-block-id="${block.id}"
                          aria-label="Add 1 hour to logged duration"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          +1.0h
                        </button>
                        <button
                          type="button"
                          data-set-mins="240"
                          data-block-id="${block.id}"
                          aria-label="Set logged duration to maximum 4 hours"
                          class="px-2.5 py-1 rounded-full ${isCardsInfused ? 'bg-black/10 border border-black/20 text-black/80 hover:bg-black/20' : 'bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-white'} text-[11px] font-semibold btn-tactile whitespace-nowrap"
                        >
                          Max (4h)
                        </button>
                      </div>

                      <!-- Recessed Bottom Well with Target Floor & Session Trigger -->
                      <div class="mt-2 flex items-center justify-between gap-3 ${isCardsInfused ? 'bg-black/10 border border-black/15 p-3 rounded-[10px]' : 'recessed-well'}">
                        <div>
                          <div class="text-[11px] ${isCardsInfused ? 'text-black/70 font-semibold' : 'text-[#71717A]'}">Target Floor</div>
                          <div class="text-[15px] font-bold ${isCardsInfused ? 'text-[#09090B]' : 'text-[#F4F4F6]'} tabular-nums mt-0.5">
                            ${targetHrs.toFixed(1)} <span class="text-[12px] ${isCardsInfused ? 'text-black/60 font-medium' : 'text-[#71717A] font-normal'}">hrs / day</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-timer-toggle="${block.id}"
                          class="px-5 py-2.5 rounded-full text-[13px] font-bold tracking-tight btn-tactile ${
                            isRunningThis
                              ? 'bg-[#FECACA] text-[#991B1B] border border-[#F87171]'
                              : (isCardsInfused
                                  ? 'bg-[#09090B] text-white shadow-md hover:bg-black/90'
                                  : 'bg-[var(--domino-accent)] text-[#09090B] shadow-sm')
                          }"
                        >
                          ${isRunningThis ? `Stop • ${timerState.formatted || '00:00'}` : 'Start Session'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </article>

              <!-- Dedicated Live Session Timer Box Directly Below Card when Running! -->
              ${isRunningThis ? `
                <div class="mt-1.5 p-3 rounded-[14px] ${isCardsInfused ? 'bg-black/10 border border-black/25' : 'bg-[#16171B] border border-[var(--domino-accent)]/40'} flex items-center justify-between drill-banner-enter">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2 h-2 rounded-full ${isCardsInfused ? 'bg-[#09090B]' : 'bg-[var(--domino-accent)]'}"></span>
                    <div>
                      <div class="text-[12px] font-semibold ${isCardsInfused ? 'text-black/75' : 'text-[var(--domino-accent)]'}">Active Drill Running</div>
                      <div class="text-[20px] font-mono font-bold ${isCardsInfused ? 'text-[#09090B]' : 'text-[#F4F4F6]'} tabular-nums leading-tight">
                        <span id="live-timer-digits-${block.id}">${timerState.formatted || '00:00'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-quick-stop="${block.id}"
                    class="px-4 py-2 rounded-full bg-[#FECACA] text-[#991B1B] border border-[#F87171] text-xs font-semibold btn-tactile flex items-center gap-1.5"
                  >
                    <span>Stop & Log</span>
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
  // Restore Defaults button from Empty State
  container.querySelector('#btn-empty-restore-defaults')?.addEventListener('click', () => {
    saveBlocks(structuredClone(DEFAULT_BLOCKS));
    playRelayClick();
    renderDashboard(container);
  });

  // Hero countdown click -> Exact exam timing toast
  container.querySelector('#btn-hero-countdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playRelayClick();
    showExamToast();
  });

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

  // Card body expansion (Emil Kowalski Accordion Toggle without DOM thrashing)
  container.querySelectorAll('[data-card-id]').forEach(card => {
    const toggleDrawer = () => {
      const id = card.dataset.cardId;
      const drawer = card.querySelector('[data-drawer-wrapper]');
      const willOpen = !drawer?.classList.contains('is-open');

      // Close all other open drawers smoothly
      container.querySelectorAll('[data-drawer-wrapper]').forEach(d => {
        d.classList.remove('is-open');
      });

      if (willOpen && drawer) {
        drawer.classList.add('is-open');
        expandedBlockId = id;
      } else {
        expandedBlockId = null;
      }
      playRelayClick();
    };

    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      toggleDrawer();
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('button') || e.target.closest('input')) return;
        e.preventDefault();
        toggleDrawer();
      }
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

      const mandatoryBlocks = getBlocks().filter(isDominoTask);
      const recBefore = getDayRecord(activeDateStr);
      const wasCompleted = recBefore.completed.includes(blockId);
      const wasAllLocked = mandatoryBlocks.length > 0 && mandatoryBlocks.every(b => recBefore.completed.includes(b.id));

      toggleDominoComplete(blockId, activeDateStr);
      playRelayClick();

      const recAfter = getDayRecord(activeDateStr);
      const nowCompleted = recAfter.completed.includes(blockId);
      const nowAllLocked = mandatoryBlocks.length > 0 && mandatoryBlocks.every(b => recAfter.completed.includes(b.id));

      renderDashboard(container);

      // In-place tactile spring pop on this card if completed
      if (!wasCompleted && nowCompleted) {
        const cardEl = container.querySelector(`[data-card-id="${blockId}"]`);
        if (cardEl) {
          cardEl.classList.remove('card-complete-pop');
          void cardEl.offsetWidth;
          cardEl.classList.add('card-complete-pop');
        }
      }

      // If all 4 dominos achieved 100% completion, trigger celebratory animation!
      if (!wasAllLocked && nowAllLocked) {
        triggerVictoryCelebration(container);
      }
    });
  });

  // Replay 100% celebration button in hero sheet
  container.querySelector('#btn-replay-celebration')?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerVictoryCelebration(container);
  });

  // Fluid Range Slider input (Strictly reactive to active accent and card infusion)
  container.querySelectorAll('[data-slider-block]').forEach(slider => {
    slider.addEventListener('input', e => {
      const blockId = slider.dataset.sliderBlock;
      const hours = parseFloat(e.target.value);
      const mins = Math.round(hours * 60);
      setDominoDuration(blockId, activeDateStr, mins);
      const isInfused = getCardInfusionScope() === 'all';
      slider.style.background = isInfused
        ? `linear-gradient(to right, #09090B 0%, #09090B ${(hours / 6) * 100}%, rgba(0,0,0,0.18) ${(hours / 6) * 100}%, rgba(0,0,0,0.18) 100%)` /* taste-skill-ignore */
        : `linear-gradient(to right, var(--domino-accent) 0%, var(--domino-accent) ${(hours / 6) * 100}%, var(--surface-well) ${(hours / 6) * 100}%, var(--surface-well) 100%)`; /* taste-skill-ignore */
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

/**
 * Micro-confetti particle sparks emitting from Hero Planning card.
 * Lightweight, hardware accelerated standard Canvas 2D API.
 */
function spawnHeroConfetti(heroEl) {
  const oldCanvas = heroEl.querySelector('.celebration-canvas');
  if (oldCanvas) oldCanvas.remove();

  const canvas = document.createElement('canvas');
  canvas.className = 'celebration-canvas';
  heroEl.style.position = 'relative';
  heroEl.appendChild(canvas);

  const rect = heroEl.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--domino-accent').trim() || '#C4B5FD';
  const colors = [accentColor, '#F59E0B', '#FFFFFF', '#09090B', '#3898FF'];

  const particles = Array.from({ length: 48 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 5.5;
    return {
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.22
    };
  });

  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed > 1600) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gentle gravity
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - elapsed / 1500);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/**
 * 100% All-Dominos Completion Celebration:
 * 1. Web Audio API ascending harmonic chime (A-Major chord) + haptics
 * 2. Synchronized 60ms ripple wave down all 4 cards
 * 3. Micro-confetti sparks from Hero Planning Card
 */
export function triggerVictoryCelebration(container) {
  // 1. Synthesize audio chime + haptic vibration
  playVictoryChime();

  // 2. Ripple cascade across all domino cards
  const cards = container.querySelectorAll('article.bento-card');
  cards.forEach((card, idx) => {
    card.style.animationDelay = `${idx * 60}ms`;
    card.classList.remove('celebration-ripple');
    void card.offsetWidth;
    card.classList.add('celebration-ripple');
  });

  // 3. Canvas Micro-Confetti Sparks from Hero card
  const heroSheet = container.querySelector('.ron-top-sheet');
  if (heroSheet && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    spawnHeroConfetti(heroSheet);
  }
}
