// src/views/studio-proctor.js
import partBData from '../data/part_b_questions.json';
import { logHours, getDayRecord, saveState, getState } from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';

let activeDayIndex = 0;       // 0 to 86 (Day 1 to 87)
let activeQuestionIndex = 0;  // 0 to 4 (Q1 to Q5)
let studioMode = 'DRILL';     // 'DRILL' (24m) or 'EXAM' (120m)
let showTrendDrawer = false;
let showChecklistDrawer = true;
let oledDeskMode = false;
let timerInterval = null;
let timerState = null;        // { startedAt, durationSec }

const DEFAULT_CHECKLIST = [
  '1. Thumbnail & Perspective Grid (3m)',
  '2. Primary Form & Human Scale (8m)',
  '3. Line Weight & Material Shading (8m)',
  '4. Callouts & Design Notes (5m)'
];

function showInAppToast(msg) {
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs font-mono font-bold tracking-tight border-2 border-white bg-black text-white shadow-2xl transition-all duration-300 pointer-events-none select-none max-w-[90vw] text-center';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs font-mono font-bold tracking-tight border-2 border-white bg-black text-white shadow-2xl transition-all duration-300 pointer-events-none select-none max-w-[90vw] text-center opacity-100 scale-100';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.className += ' opacity-0 scale-95';
  }, 3200);
}

export function renderStudioProctor(container, onBack = null, initialDate = null, questionBank = null) {
  if (timerInterval) clearInterval(timerInterval);

  const bank = (questionBank && questionBank.length > 0) ? questionBank : partBData;
  const todayStr = (typeof initialDate === 'string' && initialDate) ? initialDate : new Date().toISOString().slice(0, 10);
  const examCountdown = getExamCountdown();

  // If activeDayIndex was not set manually, align with calendar day
  if (activeDayIndex === 0) {
    const calcIndex = getDayIndex(todayStr);
    if (calcIndex >= 0 && calcIndex < 87) {
      activeDayIndex = calcIndex;
    }
  }

  const rawDayData = bank.find(p => p.day === (activeDayIndex + 1)) || bank[activeDayIndex] || bank[0];

  // Map to normalized daySet schema
  const daySet = {
    day: rawDayData.day || (activeDayIndex + 1),
    questions: (rawDayData.questions || [
      { id: 'q1', code: 'SKETCH', title: rawDayData.title || 'Perspective Storytelling', marks: 20, mins: 24, prompt: rawDayData.prompt || 'Draw a two-point perspective interior view of a busy morning railway tea stall from a low eye level.', trend: rawDayData.examinerAngle || rawDayData.trend || 'Examiners reward foreground-midground-background depth and authentic Indian ergonomic postures.' },
      { id: 'q2', code: 'PROD', title: 'Industrial Product Concept', marks: 20, mins: 24, prompt: 'Design a modular, spill-proof delivery crate for quick-commerce two-wheeler riders carrying fragile fresh produce.', trend: 'Focus on 3 exploded callouts: latching mechanism, ventilation slots, and one-handed operation.' },
      { id: 'q3', code: 'VCD', title: 'Visual Communication Campaign', marks: 20, mins: 24, prompt: 'Create a 3-frame storyboard and poster layout for an urban night-walk safety initiative.', trend: 'High-contrast silhouette hierarchy and clear typographic grid win maximum marks.' },
      { id: 'q4', code: 'ANIM', title: 'Keyframe Character Acting', marks: 20, mins: 24, prompt: 'Sketch 4 sequential keyframes of an exhausted athlete lifting a heavy steel gate.', trend: 'Exaggerate anticipation and weight transfer through spine line-of-action.' },
      { id: 'q5', code: 'IXD', title: 'Hardware-Software Interface', marks: 20, mins: 24, prompt: 'Design a tactile diagnostic handheld interface for field agricultural soil testing in bright sunlight.', trend: 'Prioritize physical button ergonomics, high-contrast E-ink/AMOLED states, and error recovery.' }
    ]).map((qItem, idx) => ({
      id: qItem.id || `q${idx + 1}`,
      code: qItem.code || (idx === 0 ? 'SKETCH' : idx === 1 ? 'PROD' : idx === 2 ? 'VCD' : idx === 3 ? 'ANIM' : 'IXD'),
      title: qItem.title || `Part B Challenge ${idx + 1}`,
      marks: qItem.marks || 20,
      mins: qItem.mins || 24,
      prompt: qItem.prompt || qItem.problemStatement || 'Execute the design prompt with high spatial and human ergonomic fidelity.',
      trend: qItem.trend || qItem.examinerAngle || 'Prioritize speed, primary form, human scale, and functional callouts.'
    }))
  };

  const q = daySet.questions[activeQuestionIndex] || daySet.questions[0];

  // Fullscreen OLED Desk Clock Mode for physical paper sketching
  if (oledDeskMode) {
    container.innerHTML = `
      <div class="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6 font-mono text-white select-none">
        <div class="flex justify-between items-center text-xs text-neutral-400">
          <span>DAY ${daySet.day} // ${q.code}</span>
          <button id="btn-exit-oled" class="border border-neutral-700 px-3 py-1.5 text-white active:bg-white active:text-black">EXIT OLED</button>
        </div>
        <div class="my-auto text-center">
          <div id="studio-timer-display" class="text-7xl font-bold tracking-tighter text-[#FF69AF]">24:00</div>
          <div class="text-xs text-neutral-300 mt-4 max-w-xs mx-auto line-clamp-2">${q.prompt}</div>
        </div>
        <button id="btn-complete-sprint" class="w-full h-12 border-2 border-[#FF69AF] text-[#FF69AF] font-bold text-xs uppercase active:bg-[#FF69AF] active:text-black">
          FINISH & LOG TO STUDY DOMINO
        </button>
      </div>
    `;
    bindStudioEvents(container, bank, daySet, q, todayStr);
    startTickerLoop(container);
    return;
  }

  container.innerHTML = `
    <section class="w-full max-w-[390px] mx-auto px-3 pt-2 pb-24 font-mono text-white select-none">
      <!-- ZONE 1: Sticky Top HUD Bar with Countdown -->
      <div class="border-2 border-white bg-[#0a0a0a] px-2.5 py-2 flex items-center justify-between gap-1.5 mb-2">
        <button id="btn-day-cycle" class="border border-neutral-700 px-2 py-1 text-xs font-bold active:bg-white active:text-black truncate" title="Jump to Day">
          D${String(daySet.day).padStart(2, '0')}/87 ▾
        </button>

        <button id="btn-mode-toggle" class="border border-neutral-700 px-1.5 py-1 text-[10px] text-neutral-300">
          ${studioMode === 'DRILL' ? '24M DRILL' : '120M EXAM'}
        </button>

        <button
          id="studio-exam-countdown"
          class="text-[10px] font-bold text-white bg-black border border-neutral-700 px-1.5 py-0.5 active:border-[#FF69AF] active:text-[#FF69AF]"
          title="${examCountdown.detailed}"
        >
          ${examCountdown.compact}
        </button>

        <div id="studio-timer-display" class="text-xs font-bold px-1.5 py-1 border ${timerState ? 'border-[#FF69AF] text-[#FF69AF]' : 'border-neutral-800 text-white'}">
          ${studioMode === 'DRILL' ? '24:00' : '120:00'}
        </div>
      </div>

      <!-- ZONE 2: 5-Pill Question Deck Switcher -->
      <div class="grid grid-cols-5 gap-1 mb-2">
        ${daySet.questions.map((item, idx) => {
          const isCurrent = idx === activeQuestionIndex;
          return `
            <button
              data-q-idx="${idx}"
              class="h-11 border-2 ${isCurrent ? 'border-[#FF69AF] bg-[#FF69AF] text-black font-bold' : 'border-neutral-800 bg-[#0a0a0a] text-neutral-300'} flex flex-col items-center justify-center text-[10px] leading-tight"
            >
              <span>Q${idx + 1}</span>
              <span class="text-[9px] truncate max-w-full px-0.5">${item.code}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- ZONE 3: Single Focused Question Card -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-2">
        <div class="flex items-center justify-between text-[10px] text-neutral-400 border-b border-neutral-800 pb-2 mb-2">
          <span class="text-[#FF69AF] font-bold truncate pr-1">Q${activeQuestionIndex + 1} // ${q.title.toUpperCase()}</span>
          <span class="shrink-0">${q.marks}M • ${q.mins}m</span>
        </div>

        <p class="text-xs leading-relaxed text-white font-sans mb-3">
          ${q.prompt}
        </p>

        <!-- Collapsible Trend Drawer -->
        <div class="border border-neutral-800 bg-black mb-2">
          <button id="btn-toggle-trend" class="w-full px-2.5 py-2 text-left text-[11px] flex justify-between items-center text-neutral-300">
            <span>GAME THEORY & EXAMINER TREND</span>
            <span>${showTrendDrawer ? '−' : '+'}</span>
          </button>
          ${showTrendDrawer ? `
            <div class="px-2.5 pb-2.5 text-[11px] text-neutral-400 border-t border-neutral-900 pt-2 leading-relaxed">
              ${q.trend}
            </div>
          ` : ''}
        </div>

        <!-- Collapsible Drawing Checklist -->
        <div class="border border-neutral-800 bg-black">
          <button id="btn-toggle-checklist" class="w-full px-2.5 py-2 text-left text-[11px] flex justify-between items-center text-neutral-300">
            <span>24-MINUTE EXECUTION CHECKLIST</span>
            <span>${showChecklistDrawer ? '−' : '+'}</span>
          </button>
          ${showChecklistDrawer ? `
            <div class="px-2.5 pb-2.5 pt-1 border-t border-neutral-900 flex flex-col gap-1.5">
              ${DEFAULT_CHECKLIST.map(step => `
                <label class="flex items-center gap-2 text-[11px] text-neutral-300 py-0.5 cursor-pointer">
                  <input type="checkbox" class="accent-[#FF69AF] w-4 h-4 cursor-pointer" />
                  <span>${step}</span>
                </label>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ZONE 4: Thumb-Zone Action Bar & Direct Study Domino Logger -->
      <div class="grid grid-cols-2 gap-2 mb-2">
        <button
          id="btn-start-stop"
          class="h-12 border-2 ${timerState ? 'border-[#FF69AF] bg-[#FF69AF] text-black' : 'border-white bg-white text-black'} font-bold text-xs uppercase active:scale-95 transition-transform"
        >
          ${timerState ? 'STOP SPRINT' : 'START TIMER'}
        </button>

        <button
          id="btn-oled-mode"
          class="h-12 border-2 border-neutral-700 bg-[#0a0a0a] text-white font-bold text-xs uppercase active:bg-white active:text-black"
        >
          OLED DESK CLOCK
        </button>
      </div>

      <!-- Direct Study / Paperwork Domino Sync Bar -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-2.5">
        <div class="text-[10px] text-neutral-400 uppercase mb-2">
          LOG PART B SESSION DIRECTLY TO STUDY / PAPERWORK DOMINO:
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          <button data-log-studio="30" class="h-11 border border-neutral-700 text-xs font-bold active:bg-[#FF69AF] active:text-black">+30M STUDY</button>
          <button data-log-studio="60" class="h-11 border border-neutral-700 text-xs font-bold active:bg-[#FF69AF] active:text-black">+1H STUDY</button>
          <button data-log-studio="120" class="h-11 border border-[#FF69AF] text-[#FF69AF] text-xs font-bold active:bg-[#FF69AF] active:text-black">+2H SPRINT</button>
        </div>
      </div>
    </section>
  `;

  bindStudioEvents(container, bank, daySet, q, todayStr);
  startTickerLoop(container);
}

function startTickerLoop(container) {
  if (!timerState) return;
  const updateDisplay = () => {
    const el = container.querySelector('#studio-timer-display');
    if (!el) return;
    const elapsedSec = Math.floor((Date.now() - timerState.startedAt) / 1000);
    const remainingSec = Math.max(0, timerState.durationSec - elapsedSec);
    const m = String(Math.floor(remainingSec / 60)).padStart(2, '0');
    const s = String(remainingSec % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
  };
  updateDisplay();
  timerInterval = setInterval(updateDisplay, 1000);
}

function bindStudioEvents(container, questionBank, daySet, q, todayStr) {
  container.querySelector('#studio-exam-countdown')?.addEventListener('click', () => {
    const cd = getExamCountdown();
    playRelayClick();
    showInAppToast(cd.detailed);
  });

  // Switch Q1-Q5 tabs
  container.querySelectorAll('[data-q-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeQuestionIndex = Number(btn.getAttribute('data-q-idx'));
      playRelayClick();
      renderStudioProctor(container, null, todayStr, questionBank);
    });
  });

  // Cycle Day 1-87
  const dayBtn = container.querySelector('#btn-day-cycle');
  if (dayBtn) {
    dayBtn.addEventListener('click', () => {
      const input = prompt('Jump to Studio Day (1 - 87):', String(activeDayIndex + 1));
      const num = Number(input);
      if (num >= 1 && num <= 87) {
        activeDayIndex = num - 1;
        playRelayClick();
        renderStudioProctor(container, null, todayStr, questionBank);
      }
    });
  }

  // Toggle 24m Drill vs 120m Exam
  const modeBtn = container.querySelector('#btn-mode-toggle');
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      studioMode = studioMode === 'DRILL' ? 'EXAM' : 'DRILL';
      timerState = null;
      playRelayClick();
      renderStudioProctor(container, null, todayStr, questionBank);
    });
  }

  // Expand/collapse Trend & Checklist drawers
  container.querySelector('#btn-toggle-trend')?.addEventListener('click', () => {
    showTrendDrawer = !showTrendDrawer;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  container.querySelector('#btn-toggle-checklist')?.addEventListener('click', () => {
    showChecklistDrawer = !showChecklistDrawer;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  // Start / Stop Sprint Timer
  container.querySelector('#btn-start-stop')?.addEventListener('click', () => {
    if (timerState) {
      const elapsedMins = Math.max(1, Math.round((Date.now() - timerState.startedAt) / 60000));
      timerState = null;
      logHours(todayStr, 'd2', elapsedMins, `Part B Studio (${q.code})`);
      showInAppToast(`Logged ${elapsedMins}m to Domino 2`);
    } else {
      timerState = {
        startedAt: Date.now(),
        durationSec: studioMode === 'DRILL' ? 24 * 60 : 120 * 60
      };
      playRelayClick();
    }
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  // OLED Desk Clock Toggle
  container.querySelector('#btn-oled-mode')?.addEventListener('click', () => {
    if (!timerState) {
      timerState = {
        startedAt: Date.now(),
        durationSec: studioMode === 'DRILL' ? 24 * 60 : 120 * 60
      };
    }
    oledDeskMode = true;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  container.querySelector('#btn-exit-oled')?.addEventListener('click', () => {
    oledDeskMode = false;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  container.querySelector('#btn-complete-sprint')?.addEventListener('click', () => {
    const elapsedMins = timerState
      ? Math.max(24, Math.round((Date.now() - timerState.startedAt) / 60000))
      : 24;
    timerState = null;
    oledDeskMode = false;
    logHours(todayStr, 'd2', elapsedMins, `Part B Studio (${q.code})`);
    showInAppToast(`Finished! Logged ${elapsedMins}m to Domino 2`);
    renderStudioProctor(container, null, todayStr, questionBank);
  });

  // Quick-log Studio minutes directly into Study Domino ('d2')
  container.querySelectorAll('[data-log-studio]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = Number(btn.getAttribute('data-log-studio'));
      logHours(todayStr, 'd2', mins, `Part B Studio (${q.code})`);
      showInAppToast(`+${mins}m logged to Domino 2`);
      renderStudioProctor(container, null, todayStr, questionBank);
    });
  });
}
