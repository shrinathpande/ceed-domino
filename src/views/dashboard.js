// src/views/dashboard.js
import {
  getBlocks,
  getDayRecord,
  logHours,
  logPartAQuestions,
  isDominoTask,
  getState,
  saveState
} from '../core/state.js';
import { playRelayClick, playAlarmTone } from '../utils/sound.js';
import { showInAppToast } from '../components/header.js';
import {
  startLockScreenTimer,
  stopLockScreenTimer
} from '../utils/lockscreen-timer.js';

export const ALARMS_KEY = 'ceed_v2_alarms';
const ACTIVE_TIMER_KEY = 'ceed_v2_active_timer';

const DEFAULT_CHECKPOINTS = [
  { id: 'cp_0600', time: '06:00', label: '06:00 AM // WAKE & WALK', note: 'Hydrate, lace up, start walk', alarmOn: true, actions: [{ label: '+1.5H WALK', blockId: 'd1', mins: 90 }] },
  { id: 'cp_open', time: '06:00-11:00', label: '06:00 – 11:00 AM // OPEN WINDOW', note: 'Flexible study or client output', alarmOn: false, actions: [{ label: '+1H STUDY', blockId: 'd2', mins: 60 }, { label: '+1H WORK', blockId: 'd4', mins: 60 }] },
  { id: 'cp_1100', time: '11:00', label: '11:00 AM – 01:00 PM // SPRINT 1', note: 'Deep Study or Portfolio Studio', alarmOn: true, actions: [{ label: '+2H STUDY', blockId: 'd2', mins: 120 }, { label: '+2H WORK', blockId: 'd4', mins: 120 }] },
  { id: 'cp_1300', time: '13:00', label: '01:00 PM – 02:00 PM // FREE RECHARGE', note: 'Biphasic nap or lunch off-duty', alarmOn: false, actions: [] },
  { id: 'cp_1400', time: '14:00', label: '02:00 PM – 05:00 PM // SPRINT 2', note: 'Paperwork / CEED Sprint or Work', alarmOn: true, actions: [{ label: '+3H PAPER', blockId: 'd3', mins: 180 }, { label: '+3H WORK', blockId: 'd4', mins: 180 }] },
  { id: 'cp_1900', time: '19:00', label: '07:00 PM – 09:00 PM // SPRINT 3', note: 'Evening Study or Work session', alarmOn: true, actions: [{ label: '+2H STUDY', blockId: 'd2', mins: 120 }, { label: '+2H WORK', blockId: 'd4', mins: 120 }] },
  { id: 'cp_2100', time: '21:00', label: '09:00 PM – 11:00 PM // NIGHT SPRINT', note: 'Final push & 11:00 PM wind-down', alarmOn: true, actions: [{ label: '+2H STUDY', blockId: 'd2', mins: 120 }, { label: '+2H WORK', blockId: 'd4', mins: 120 }] }
];

let expandedBlockId = 'd3'; // Default open to Paperwork & Part A Micro-Counter
let showCheckpoints = false;
let activeDateStr = new Date().toISOString().slice(0, 10);
let liveStopwatchInterval = null;
let alarmWatcherInterval = null;
let lastTriggeredMinute = '';

function getCheckpoints() {
  try {
    const raw = localStorage.getItem(ALARMS_KEY);
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_CHECKPOINTS);
  } catch {
    return structuredClone(DEFAULT_CHECKPOINTS);
  }
}

function saveCheckpoints(list) {
  localStorage.setItem(ALARMS_KEY, JSON.stringify(list));
}

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
  startAlarmDaemon();

  const blocks = getBlocks();
  const record = getDayRecord(activeDateStr);
  const checkpoints = getCheckpoints();
  const activeTimer = getActiveTimer();

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
      <div class="card-shell border ${allDominosDone ? 'border-[#FF69AF] bg-[#12040c]' : 'border-neutral-800 bg-[#0a0a0a]'} p-2.5 mb-2.5 flex items-center justify-between">
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
          <span class="text-[11px] font-bold ${allDominosDone ? 'text-[#FF69AF]' : 'text-neutral-400'}">
            ${allDominosDone ? '★ STREAK LOCKED' : `${completedDominoCount}/${mandatoryBlocks.length} DOMINOS`}
          </span>
        </div>
      </div>

      <!-- Dual Daily Hour Ledger -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <!-- Study Card -->
        <div class="card-shell border border-[#FF69AF]/60 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">STUDY TIME</div>
          <div class="text-2xl font-bold text-[#FF69AF] mt-1 mb-0.5">
            ${(todayStudyMins / 60).toFixed(1)} <span class="text-xs font-normal text-neutral-400">HRS</span>
          </div>
          <div class="text-[10px] text-neutral-400">
            Part A: <span class="text-white font-bold">${record.partACount || 0}</span>/35 Qs
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
        <span>DOMINO PILLARS (TAP CARD TO EXPAND)</span>
        <span class="text-neutral-500 text-[9px]">LOCK-SCREEN READY</span>
      </div>

      <div class="flex flex-col gap-2.5 mb-3">
        ${blocks.map(b => renderDominoBlockCard(b, record, activeTimer)).join('')}
      </div>

      <!-- Universal Quick-Log Button Bar -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-2.5 mb-3">
        <div class="text-[10px] text-neutral-400 uppercase mb-2 flex justify-between items-center">
          <span>+ QUICK LOG PRODUCTIVE ACTIVITY</span>
          <span class="text-white font-bold text-[9px]">ANYTIME</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          <button data-quick-cat="STUDY" class="btn-tactile h-11 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-[#FF69AF] active:text-black">
            + STUDY
          </button>
          <button data-quick-cat="WORK" class="btn-tactile h-11 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-white active:text-black">
            + WORK
          </button>
          <button data-quick-cat="WALK" class="btn-tactile h-11 border border-neutral-700 bg-[#080808] text-[11px] font-bold text-white active:bg-white active:text-black">
            + WALK
          </button>
        </div>
      </div>

      <!-- Daily Alarms Checkpoints Drawer -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] mb-3">
        <button id="btn-toggle-checkpoints" class="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-white border-b border-neutral-800">
          <span>⏰ DAILY ALARMS & CHECKPOINTS</span>
          <span class="text-neutral-400 text-sm">${showCheckpoints ? '−' : '+'}</span>
        </button>

        ${showCheckpoints ? `
          <div class="divide-y divide-neutral-900">
            ${checkpoints.map(cp => `
              <div class="p-2.5 bg-black/60">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-[11px] font-bold text-white">${cp.label}</span>
                  ${cp.time.length === 5 ? `
                    <button
                      data-alarm-toggle="${cp.id}"
                      class="btn-tactile px-2.5 py-1 text-[10px] border ${cp.alarmOn ? 'border-[#FF69AF] text-[#FF69AF] font-bold' : 'border-neutral-700 text-neutral-500'}"
                    >
                      ${cp.alarmOn ? '🔔 ON' : 'OFF'}
                    </button>
                  ` : ''}
                </div>
                <div class="text-[10px] text-neutral-400 mb-2">${cp.note}</div>
                ${cp.actions.length > 0 ? `
                  <div class="flex gap-1.5 flex-wrap">
                    ${cp.actions.map(act => `
                      <button
                        data-cp-block="${act.blockId}"
                        data-cp-mins="${act.mins}"
                        data-cp-label="${cp.label}"
                        class="btn-tactile h-9 px-3 border border-neutral-700 bg-[#0c0c0c] text-[10px] font-bold text-white active:bg-[#FF69AF] active:text-black"
                      >
                        ${act.label}
                      </button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Activity Feed -->
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
                <span class="font-bold ${item.mins >= 0 ? 'text-[#FF69AF]' : 'text-neutral-400'} shrink-0">
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

function renderDominoBlockCard(block, record, activeTimer) {
  const loggedMins = Number(record.durations[block.id]) || 0;
  const targetMins = record.emergency ? Math.ceil(block.targetMins / 2) : block.targetMins;
  const isDone = Array.isArray(record.completed) && record.completed.includes(block.id);
  const isMandatory = isDominoTask(block);
  const isUnder = isDone && loggedMins < targetMins;
  const isExpanded = expandedBlockId === block.id;
  const isRunning = activeTimer && activeTimer.blockId === block.id;
  const showPartA = block.id === 'd3' || block.hasPartACounter;

  const pct = Math.min(100, Math.round((loggedMins / Math.max(1, targetMins)) * 100));
  const partACount = record.partACount || 0;
  const partAPct = Math.min(100, Math.round((partACount / 35) * 100));

  const borderStyle = isDone
    ? 'border-2 border-[#FF69AF] bg-[#0c0409]'
    : isRunning
    ? 'border-2 border-white bg-[#0e0e0e]'
    : 'border border-neutral-800 bg-[#0c0c0c]';

  return `
    <div
      class="card-shell ${borderStyle} cursor-pointer select-none"
      data-card-id="${block.id}"
      role="button"
      tabindex="0"
      aria-expanded="${isExpanded}"
      aria-label="${block.name} Domino Card"
    >
      <!-- Main Card Header Area -->
      <div class="p-3 flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 text-[10px] mb-1">
            <span class="btn-tactile px-1.5 py-0.5 font-bold ${isMandatory ? 'bg-[#FF69AF] text-black' : 'border border-neutral-700 text-neutral-300'}">
              ${block.badge}
            </span>
            <span class="text-neutral-400">${block.category}</span>
            ${showPartA ? `<span class="px-1 border ${partACount >= 35 ? 'border-[#FF69AF] text-[#FF69AF]' : 'border-neutral-700 text-neutral-400'}">PART A: ${partACount}/35</span>` : ''}
            ${isUnder ? `<span class="px-1 border border-yellow-500 text-yellow-400 text-[9px]">UNDER</span>` : ''}
          </div>
          <div class="text-xs font-bold text-white truncate">${block.name}</div>
          <div class="w-full h-1.5 bg-black border border-neutral-800 mt-2 rounded-full overflow-hidden">
            <div class="liquid-progress h-full bg-[#FF69AF]" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <div class="text-right">
            <div class="text-sm font-bold ${loggedMins >= targetMins ? 'text-[#FF69AF]' : 'text-white'}">
              ${isRunning ? `<span data-live-sw class="text-[#FF69AF]">LIVE</span>` : `${(loggedMins / 60).toFixed(1)}h`}
            </div>
            <div class="text-[10px] text-neutral-500">/ ${(targetMins / 60).toFixed(1)}h</div>
          </div>

          <button
            data-manual-toggle="${block.id}"
            data-target-mins="${targetMins}"
            class="btn-tactile w-11 h-11 border-2 ${isDone ? 'border-[#FF69AF] bg-[#FF69AF] text-black' : 'border-neutral-700 bg-black text-white'} font-bold text-sm flex items-center justify-center"
            aria-label="${isDone ? 'Mark Incomplete' : 'Complete Domino'}"
          >
            ${isDone ? '✓' : '○'}
          </button>
        </div>
      </div>

      <!-- Expanded Drawer: Hour Logging Pills + Lock-Screen Stopwatch + Part A Micro-Counter -->
      ${isExpanded ? `
        <div class="px-3 pb-3 pt-2 border-t border-neutral-800/80 bg-black/60 flex flex-col gap-2.5" data-drawer>
          <!-- Quick Hour Pills -->
          <div>
            <div class="text-[10px] text-neutral-400 uppercase mb-1.5 flex justify-between">
              <span>TAP TO LOG HOURS:</span>
              <span class="text-neutral-500">ACCUMULATIVE</span>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <button data-log-mins="30" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+0.5h</button>
              <button data-log-mins="60" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+1.0h</button>
              <button data-log-mins="90" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+1.5h</button>
              <button data-log-mins="120" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+2.0h</button>
              <button data-log-mins="180" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+3.0h</button>
              <button data-log-mins="240" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-700 text-xs font-bold text-white active:bg-[#FF69AF] active:text-black">+4.0h</button>
              <button data-log-mins="-30" data-block="${block.id}" class="btn-tactile h-11 border border-neutral-800 text-neutral-400 text-xs active:bg-neutral-800">-0.5h</button>
              <button
                data-timer-toggle="${block.id}"
                class="btn-tactile h-11 border-2 ${isRunning ? 'border-[#FF69AF] bg-[#FF69AF] text-black' : 'border-white text-white'} text-[11px] font-bold"
              >
                ${isRunning ? 'STOP' : '🔒 TIMER'}
              </button>
            </div>
          </div>

          <!-- Embedded Daily Part A Micro-Counter -->
          ${showPartA ? `
            <div class="border border-neutral-800 bg-[#0a0a0a] p-2.5 rounded-lg">
              <div class="flex items-center justify-between text-[10px] mb-1.5">
                <span class="font-bold text-white">DAILY 35-QUESTION PART A DRILL</span>
                <span class="font-bold ${partACount >= 35 ? 'text-[#FF69AF]' : 'text-neutral-300'}">${partACount} / 35 Qs</span>
              </div>
              <div class="w-full h-1.5 bg-black border border-neutral-800 mb-2 rounded-full overflow-hidden">
                <div class="liquid-progress h-full bg-[#FF69AF]" style="width: ${partAPct}%"></div>
              </div>
              <div class="grid grid-cols-4 gap-1.5">
                <button data-part-a="-5" class="btn-tactile h-10 border border-neutral-800 text-neutral-400 text-xs">-5 Qs</button>
                <button data-part-a="5" class="btn-tactile h-10 border border-neutral-700 text-white text-xs font-bold active:bg-[#FF69AF] active:text-black">+5 Qs</button>
                <button data-part-a="10" class="btn-tactile h-10 border border-neutral-700 text-white text-xs font-bold active:bg-[#FF69AF] active:text-black">+10 Qs</button>
                <button data-part-a-exact="35" class="btn-tactile h-10 border border-[#FF69AF] text-[#FF69AF] text-[11px] font-bold active:bg-[#FF69AF] active:text-black">35/35</button>
              </div>
              <div class="text-[9px] text-neutral-500 mt-1.5 text-center">
                Hitting 35/35 automatically logs +1.0h to Paperwork Domino
              </div>
            </div>
          ` : ''}
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

  // Universal Card Tap to Expand/Collapse
  container.querySelectorAll('[data-card-id]').forEach(card => {
    const toggleExpansion = (e) => {
      // If tap originated from an interactive child button, ignore card toggle
      if (e.target.closest('button, input, select, textarea, [data-log-mins], [data-part-a], [data-part-a-exact], [data-timer-toggle]')) {
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

  // Manual Checkoff Toggle
  container.querySelectorAll('[data-manual-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-manual-toggle');
      const targetMins = Number(btn.getAttribute('data-target-mins')) || 60;
      const state = getState();
      const rec = getDayRecord(activeDateStr);

      if (rec.completed.includes(id)) {
        rec.completed = rec.completed.filter(x => x !== id);
        saveState(state);
        playRelayClick();
        showInAppToast('Domino unmarked');
      } else {
        if (!rec.durations[id]) {
          logHours(activeDateStr, id, targetMins);
        } else {
          rec.completed.push(id);
          saveState(state);
          playRelayClick();
        }
        showInAppToast('★ Domino Completed!', true);
      }
      renderDashboard(container);
    });
  });

  // Quick Hour Pills
  container.querySelectorAll('[data-log-mins]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blockId = btn.getAttribute('data-block');
      const mins = Number(btn.getAttribute('data-log-mins'));
      logHours(activeDateStr, blockId, mins);
      showInAppToast(`${mins >= 0 ? '+' : ''}${mins / 60}h logged`);
      renderDashboard(container);
    });
  });

  // Part A Micro-Counter
  container.querySelectorAll('[data-part-a]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const delta = Number(btn.getAttribute('data-part-a'));
      logPartAQuestions(activeDateStr, delta, false);
      showInAppToast(`${delta >= 0 ? '+' : ''}${delta} Part A Questions`);
      renderDashboard(container);
    });
  });

  container.querySelectorAll('[data-part-a-exact]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const exact = Number(btn.getAttribute('data-part-a-exact'));
      logPartAQuestions(activeDateStr, exact, true);
      showInAppToast('35/35 Part A Target Cleared! +1h Reward', true);
      renderDashboard(container);
    });
  });

  // LockScreen Stopwatch
  container.querySelectorAll('[data-timer-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blockId = btn.getAttribute('data-timer-toggle');
      const block = blocks.find(b => b.id === blockId);
      const current = getActiveTimer();

      const stopAndCommit = () => {
        const latest = getActiveTimer();
        if (!latest) return;
        const elapsedMins = Math.max(1, Math.round((Date.now() - latest.startedAt) / 60000));
        localStorage.removeItem(ACTIVE_TIMER_KEY);
        stopLockScreenTimer();
        logHours(activeDateStr, latest.blockId, elapsedMins);
        showInAppToast(`Timer stopped. +${elapsedMins}m logged.`);
        renderDashboard(container);
      };

      if (current && current.blockId === blockId) {
        stopAndCommit();
      } else {
        const startedAt = Date.now();
        localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify({ blockId, startedAt }));
        playRelayClick();
        if (block) {
          startLockScreenTimer(block, startedAt, stopAndCommit);
        }
        showInAppToast(`Timer started: ${block ? block.name : 'Focus'}`);
        renderDashboard(container);
      }
    });
  });

  // Quick Category Activity Bar (+ STUDY, + WORK, + WALK)
  container.querySelectorAll('[data-quick-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-quick-cat');
      const hrsInput = prompt(`How many hours of ${cat} did you complete? (e.g. 1.0, 1.5, 2.0):`, '1.0');
      const hrs = parseFloat(hrsInput);
      if (isNaN(hrs) || hrs <= 0) return;
      const mins = Math.round(hrs * 60);
      const label = prompt('Activity Note / Title:', `${cat} Session`) || `${cat} Session`;

      const matchingDomino = blocks.find(b => b.category === cat);
      if (matchingDomino) {
        logHours(activeDateStr, matchingDomino.id, mins, label);
      } else {
        const state = getState();
        const rec = getDayRecord(activeDateStr);
        const now = new Date();
        rec.customMins = rec.customMins || [];
        rec.customMins.push({ category: cat, mins, label });
        rec.logs.unshift({
          id: 'log_' + Date.now(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hour24: now.getHours(),
          blockId: 'custom',
          category: cat,
          mins,
          label
        });
        saveState(state);
        playRelayClick();
      }
      showInAppToast(`+${hrs}h ${cat} recorded`);
      renderDashboard(container);
    });
  });

  // Alarms Drawer
  container.querySelector('#btn-toggle-checkpoints')?.addEventListener('click', () => {
    showCheckpoints = !showCheckpoints;
    playRelayClick();
    renderDashboard(container);
  });

  container.querySelectorAll('[data-alarm-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-alarm-toggle');
      const list = getCheckpoints();
      const item = list.find(c => c.id === id);
      if (item) {
        item.alarmOn = !item.alarmOn;
        saveCheckpoints(list);
        if (item.alarmOn && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        playRelayClick();
        showInAppToast(item.alarmOn ? `Alarm enabled for ${item.time}` : 'Alarm disabled');
        renderDashboard(container);
      }
    });
  });

  container.querySelectorAll('[data-cp-block]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blockId = btn.getAttribute('data-cp-block');
      const mins = Number(btn.getAttribute('data-cp-mins'));
      const label = btn.getAttribute('data-cp-label');
      logHours(activeDateStr, blockId, mins, label);
      showInAppToast(`+${mins}m logged`);
      renderDashboard(container);
    });
  });
}

function startAlarmDaemon() {
  if (alarmWatcherInterval) clearInterval(alarmWatcherInterval);
  alarmWatcherInterval = setInterval(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (hhmm === lastTriggeredMinute) return;

    const checkpoints = getCheckpoints();
    const hit = checkpoints.find(c => c.alarmOn && c.time === hhmm);
    if (hit) {
      lastTriggeredMinute = hhmm;
      playAlarmTone();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('CEED CHECKPOINT ALARM', { body: `${hit.label} — ${hit.note}` });
      }
      showInAppToast(`⏰ CHECKPOINT ALARM: ${hit.label} — ${hit.note}`, true);
    }
  }, 15000);
}
