// src/views/studio-proctor.js
import partBData from '../data/part_b_questions.json';
import { logHours } from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { getDayIndex } from '../utils/dates.js';
import { renderStatusPill } from '../components/status-pill.js';

let activeDayIndex = 0;       // 0 to 86 (Day 1 to 87)
let activeQuestionIndex = 0;  // 0 to 4 (Q1 to Q5)
let activeCardSide = 'PROMPT'; // 'PROMPT' (left 82%) or 'STRATEGY' (right 82%)
let oledDeskMode = false;
let timerInterval = null;
let timerState = null;        // { startedAt, durationSec, pausedRemaining }
let wakeLockSentinel = null;

const DEFAULT_CHECKLIST = [
  '1. 3-Min Thumbnail & Perspective Grid',
  '2. Primary Form & Human Scale (8m)',
  '3. Line Weight Hierarchy & Shadows (8m)',
  '4. Annotated Callouts & Problem Solution (5m)'
];

async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  } catch {}
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}

export function renderStudioProctor(container, onBack = null, initialDate = null, questionBank = null) {
  if (timerInterval) clearInterval(timerInterval);

  const bank = (questionBank && questionBank.length > 0) ? questionBank : partBData;
  const todayStr = (typeof initialDate === 'string' && initialDate) ? initialDate : new Date().toISOString().slice(0, 10);

  if (activeDayIndex === 0) {
    const calcIndex = getDayIndex(todayStr);
    if (calcIndex >= 0 && calcIndex < 87) {
      activeDayIndex = calcIndex;
    }
  }

  const rawDayData = bank.find(p => p.day === (activeDayIndex + 1)) || bank[activeDayIndex] || bank[0];

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

  // Fullscreen OLED Desk Clock Mode
  if (oledDeskMode) {
    acquireWakeLock();
    container.innerHTML = `
      <div class="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6 font-sans text-white select-none">
        <div class="flex justify-between items-center text-xs text-zinc-400">
          <span class="tracking-widest uppercase font-mono">Day ${daySet.day} // ${q.code}</span>
          <button id="btn-exit-oled" class="px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white font-medium text-xs btn-tactile">
            Exit OLED ✕
          </button>
        </div>
        <div class="my-auto text-center">
          <div id="studio-timer-display" class="text-8xl font-extrabold tracking-tight font-mono text-white tabular-nums">24:00</div>
          <div class="text-sm text-zinc-400 mt-6 max-w-sm mx-auto line-clamp-3 leading-relaxed">${q.prompt}</div>
        </div>
        <button id="btn-complete-sprint" class="w-full h-12 rounded-full bg-white text-black font-bold text-sm uppercase btn-tactile shadow-2xl">
          Finish & Log Sprint (+24m)
        </button>
      </div>
    `;
    bindStudioEvents(container, bank, daySet, q, todayStr);
    startTickerLoop(container);
    return;
  } else {
    releaseWakeLock();
  }

  const isPromptExpanded = activeCardSide === 'PROMPT';

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3.5 pt-2 pb-28 font-sans select-none" aria-label="Part B Studio Proctor">
      
      <!-- Top Navigation Pill & Switcher (Reference 5) -->
      <div class="bento-card p-2.5 mb-3.5 flex items-center justify-between gap-2">
        <!-- Day Selector Pill -->
        <div class="flex items-center gap-1 bg-[#1A1A1F] rounded-full px-2 py-1 border border-white/5">
          <button id="btn-prev-day" class="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white btn-tactile font-bold" aria-label="Previous Day">‹</button>
          <span class="text-xs font-bold text-white px-1">Day ${daySet.day} <span class="text-zinc-500 font-normal">of 87</span></span>
          <button id="btn-next-day" class="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white btn-tactile font-bold" aria-label="Next Day">›</button>
        </div>

        <!-- Q1 - Q5 Circular Switcher (Reference 5) -->
        <div class="flex items-center gap-1">
          ${daySet.questions.map((item, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            return `
              <button
                data-q-idx="${idx}"
                class="w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-all btn-tactile ${
                  isCurrent
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#1A1A1F] text-zinc-400 hover:text-white border border-white/5'
                }"
                aria-label="Question ${idx + 1}"
              >
                Q${idx + 1}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Asymmetric Peek Card Layout (Reference 6) -->
      <div class="flex gap-2.5 mb-3.5 min-h-[380px] items-stretch">
        
        <!-- Main Card 1: Question Prompt Card -->
        <div
          id="card-prompt"
          class="bento-card flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${
            isPromptExpanded ? 'w-[82%] p-5' : 'w-[18%] p-2 flex items-center justify-center bg-[#1A1A1F]/80 hover:bg-[#1A1A1F]'
          }"
        >
          ${isPromptExpanded ? `
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                ${renderStatusPill('LIVE', `${q.marks} Marks • ${q.mins}m`)}
                <span class="text-[11px] font-mono text-zinc-500 font-bold">${q.code}</span>
              </div>

              <div>
                <h2 class="text-lg font-bold text-white tracking-tight mb-2">${q.title}</h2>
                <p class="text-[14px] text-zinc-300 leading-relaxed font-normal">${q.prompt}</p>
              </div>
            </div>

            <div class="text-[11px] text-zinc-500 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span>Standard A4 Booklet Drill</span>
              <span class="text-zinc-400 font-medium">Tap right tab for Checklist →</span>
            </div>
          ` : `
            <div class="h-full flex items-center justify-center">
              <span class="transform -rotate-90 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Question Prompt
              </span>
            </div>
          `}
        </div>

        <!-- Peek Card 2: Strategy & Checklist (Reference 6) -->
        <div
          id="card-strategy"
          class="bento-card flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${
            !isPromptExpanded ? 'w-[82%] p-5' : 'w-[18%] p-2 flex items-center justify-center bg-[#1A1A1F]/80 hover:bg-[#1A1A1F]'
          }"
        >
          ${!isPromptExpanded ? `
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                ${renderStatusPill('PENDING', 'Examiner Strategy')}
                <span class="text-[11px] font-mono text-zinc-500 font-bold">IIT Bombay Rubric</span>
              </div>

              <!-- Examiner Trend Note -->
              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                <strong class="text-white block mb-0.5">High-Scoring Angle:</strong>
                ${q.trend}
              </div>

              <!-- 4-Step Checklist -->
              <div>
                <div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">4-Step Execution Protocol:</div>
                <div class="flex flex-col gap-2">
                  ${DEFAULT_CHECKLIST.map((item, idx) => `
                    <label class="flex items-center gap-2.5 text-xs text-zinc-300 p-2 rounded-lg bg-[#1A1A1F]/70 border border-white/[0.03] cursor-pointer">
                      <input type="checkbox" class="w-4 h-4 rounded text-blue-500 bg-black border-white/20 focus:ring-0 cursor-pointer" />
                      <span>${item}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="text-[11px] text-zinc-500 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span>Examiner Pacing Protocol</span>
              <span class="text-zinc-400 font-medium">← Tap left tab for Prompt</span>
            </div>
          ` : `
            <div class="h-full flex items-center justify-center">
              <span class="transform -rotate-90 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Strategy & Checklist
              </span>
            </div>
          `}
        </div>

      </div>

      <!-- Bottom Floating Scheduler Bar (Reference 5) -->
      <div class="bento-card p-3 flex items-center justify-between gap-3">
        <!-- Live Countdown Timer -->
        <div class="flex items-baseline gap-1.5 pl-1">
          <span id="studio-timer-display" class="text-2xl font-extrabold font-mono text-white tabular-nums">24:00</span>
          <span class="text-[11px] text-zinc-500 font-medium">remaining</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- OLED Desk Clock Button -->
          <button
            id="btn-oled-mode"
            class="h-10 px-3 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 btn-tactile"
            title="Fullscreen Desk Clock"
            aria-label="Fullscreen Desk Clock Mode"
          >
            <span>⛶</span>
            <span>OLED</span>
          </button>

          <!-- Crisp Solid White Pill CTA Button (Reference 5) -->
          <button
            id="btn-drill-cta"
            class="h-10 px-5 rounded-full font-bold text-xs uppercase flex items-center gap-1.5 btn-tactile shadow-lg ${
              timerState ? 'bg-emerald-400 text-black animate-pulse' : 'bg-white text-black hover:bg-zinc-100'
            }"
          >
            <span>${timerState ? '✓ Finish & Log' : '▶ Start Drill'}</span>
          </button>
        </div>
      </div>
    </section>
  `;

  bindStudioEvents(container, bank, daySet, q, todayStr);
  if (timerState) startTickerLoop(container);
}

function bindStudioEvents(container, bank, daySet, q, todayStr) {
  // Asymmetric Peek Card toggling (Reference 6)
  container.querySelector('#card-prompt')?.addEventListener('click', (e) => {
    if (activeCardSide !== 'PROMPT' && !e.target.closest('input, button')) {
      activeCardSide = 'PROMPT';
      playRelayClick();
      renderStudioProctor(container, null, todayStr, bank);
    }
  });

  container.querySelector('#card-strategy')?.addEventListener('click', (e) => {
    if (activeCardSide !== 'STRATEGY' && !e.target.closest('input, button')) {
      activeCardSide = 'STRATEGY';
      playRelayClick();
      renderStudioProctor(container, null, todayStr, bank);
    }
  });

  // Prev / Next Day
  container.querySelector('#btn-prev-day')?.addEventListener('click', () => {
    activeDayIndex = Math.max(0, activeDayIndex - 1);
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  });

  container.querySelector('#btn-next-day')?.addEventListener('click', () => {
    activeDayIndex = Math.min(86, activeDayIndex + 1);
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  });

  // Question Switcher
  container.querySelectorAll('[data-q-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeQuestionIndex = Number(btn.getAttribute('data-q-idx'));
      playRelayClick();
      renderStudioProctor(container, null, todayStr, bank);
    });
  });

  // Fullscreen OLED Desk Mode
  container.querySelector('#btn-oled-mode')?.addEventListener('click', () => {
    oledDeskMode = true;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  });

  container.querySelector('#btn-exit-oled')?.addEventListener('click', () => {
    oledDeskMode = false;
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  });

  // Start Drill / Finish & Log CTA
  container.querySelector('#btn-drill-cta')?.addEventListener('click', () => {
    handleSprintToggle(container, q, todayStr, bank);
  });

  container.querySelector('#btn-complete-sprint')?.addEventListener('click', () => {
    handleSprintToggle(container, q, todayStr, bank);
  });
}

function handleSprintToggle(container, q, todayStr, bank) {
  if (timerState) {
    // Finish and Commit elapsed minutes to Study Domino ('d2' or 'd3')
    const elapsedSec = Math.floor((Date.now() - timerState.startedAt) / 1000);
    const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));
    timerState = null;
    if (timerInterval) clearInterval(timerInterval);
    oledDeskMode = false;
    logHours(todayStr, 'd2', elapsedMins, `Part B: ${q.code} (${q.title})`);
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  } else {
    // Start 24m timer
    timerState = {
      startedAt: Date.now(),
      durationSec: 24 * 60
    };
    playRelayClick();
    renderStudioProctor(container, null, todayStr, bank);
  }
}

function startTickerLoop(container) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const display = container.querySelector('#studio-timer-display');
    if (!display || !timerState) return;
    const elapsedSec = Math.floor((Date.now() - timerState.startedAt) / 1000);
    const rem = Math.max(0, timerState.durationSec - elapsedSec);
    const m = Math.floor(rem / 60);
    const s = String(rem % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }, 1000);
}
