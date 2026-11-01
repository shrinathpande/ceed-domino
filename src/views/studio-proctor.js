// src/views/studio-proctor.js
import partBData from '../data/part_b_questions.json';
import { playRelayClick, playBeep } from '../utils/sound.js';
import { renderStatusPill } from '../components/status-pill.js';
import { startLockScreenTimer, stopLockScreenTimer } from '../utils/lockscreen-timer.js';

let studioDayIndex = 10; // 0-indexed (Day 11 default)
let activeQIndex = 0;
let isOledFullscreen = false;
let drillRunning = false;
let drillSecondsRemaining = 24 * 60;
let drillInterval = null;
let wakeLockSentinel = null;

async function requestWakeLock() {
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

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function renderStudioProctor(container) {
  const daysList = Array.isArray(partBData) ? partBData : (partBData.days || []);
  const dayObj = daysList[studioDayIndex] || {
    day: studioDayIndex + 1,
    questions: [
      {
        shortTitle: 'SKETCH',
        title: 'Sketching (POV & Perspective)',
        marks: 20,
        timeMins: 24,
        prompt: 'Scenario: A vegetable vendor pushing a four-wheeled wooden handcart up a steep flyover slope is helped by schoolboys. Task: Sketch the scene from a low 3/4 street-level perspective.'
      }
    ]
  };

  const questions = dayObj.questions || [];
  const q = questions[activeQIndex] || questions[0] || {};
  const promptText = q.prompt || '';
  
  let scenario = '';
  let task = '';
  if (promptText.includes('Scenario:') && promptText.includes('Task:')) {
    scenario = promptText.split('Scenario:')[1].split('Task:')[0].trim();
    task = promptText.split('Task:')[1].trim();
  } else if (promptText.includes('Task:')) {
    scenario = promptText.split('Task:')[0].replace(/^Mandatory.*?Mins/i, '').trim();
    task = promptText.split('Task:')[1].trim();
  } else {
    scenario = promptText.replace(/^Mandatory.*?Mins/i, '').trim();
    task = 'Execute high-precision 24-minute deliberate sketch drill adhering to IIT CEED grading dimensions.';
  }

  const strategy = q.criteria && Array.isArray(q.criteria)
    ? `IIT Bombay Evaluation Dimensions: ${q.criteria.join(' • ')}`
    : 'Prioritize speed, primary form, human scale, and dynamic diagonal perspective lines before rendering textures.';

  const timeStr = formatTime(drillSecondsRemaining);

  if (isOledFullscreen) {
    requestWakeLock();
    container.innerHTML = `
      <div id="oled-fullscreen" class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center select-none cursor-pointer">
        <div class="font-pixel-display text-[76px] text-[#F4F4F6] leading-none mb-6 tabular-nums">${timeStr}</div>
        <p class="text-[14px] text-[#A1A1AA] max-w-[320px] leading-relaxed line-clamp-3">${task || scenario}</p>
        <span class="mt-8 text-[11px] uppercase tracking-widest text-[#52525B]">Tap anywhere to exit OLED clock</span>
      </div>
    `;
    container.querySelector('#oled-fullscreen')?.addEventListener('click', () => {
      isOledFullscreen = false;
      releaseWakeLock();
      playRelayClick();
      renderStudioProctor(container);
    });
    return;
  }

  container.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2 pb-6 space-y-3.5 select-none">

      <!-- Day Stepper & Q1-Q5 Pill Switcher -->
      <div class="flex items-center justify-between gap-2">
        <div class="recessed-well !py-2 !px-3 flex items-center gap-3">
          <button type="button" id="studio-prev-day" class="text-[#A1A1AA] hover:text-white btn-tactile text-sm" aria-label="Previous Day">‹</button>
          <span class="text-[13px] font-medium text-[#F4F4F6] tabular-nums">Day ${studioDayIndex + 1} of 87</span>
          <button type="button" id="studio-next-day" class="text-[#A1A1AA] hover:text-white btn-tactile text-sm" aria-label="Next Day">›</button>
        </div>

        <div class="flex items-center gap-1">
          ${[0, 1, 2, 3, 4].map(idx => `
            <button
              type="button"
              data-q-idx="${idx}"
              class="w-[36px] h-[36px] rounded-full text-[12px] font-semibold tabular-nums transition-all btn-tactile ${
                activeQIndex === idx
                  ? 'bg-[#F4F4F6] text-[#09090B]'
                  : 'bg-[#141418] text-[#71717A] border border-white/[0.06]'
              }"
            >Q${idx + 1}</button>
          `).join('')}
        </div>
      </div>

      <!-- CARD 1: Question Prompt (Clean Stacked Card) -->
      <section class="bento-card">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="status-pill-beveled pill-inprogress !py-1 !px-2.5 !text-[11.5px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 15 15 9"/><path d="M10 9h5v5"/></svg>
            <span>${q.marks || 20} Marks • ${q.timeMins || 24}m</span>
          </span>
          <span class="text-[11px] font-semibold tracking-wider uppercase text-[#71717A]">
            ${q.shortTitle || q.category || 'SKETCH'}
          </span>
        </div>

        <h2 class="text-[19px] font-semibold text-[#F4F4F6] leading-snug mb-2.5">
          ${q.title || 'Part B Studio Problem'}
        </h2>

        <p class="text-[13.5px] text-[#D4D4D8] leading-[1.58] mb-3.5">
          ${scenario}
        </p>

        <!-- Structured Task Callout Well -->
        <div class="recessed-well border-l-2 !border-l-[#C8F560]">
          <div class="text-[10.5px] font-bold uppercase tracking-wider text-[#C8F560] mb-1">Mandatory Deliverables:</div>
          <p class="text-[13px] text-[#A1A1AA] leading-relaxed">
            ${task}
          </p>
        </div>
      </section>

      <!-- CARD 2 (Right Below It): Strategy & 24m Pacing Checklist -->
      <section class="bento-card">
        <div class="flex items-center justify-between mb-3">
          <span class="status-pill-beveled pill-pending !py-1 !px-2.5 !text-[11.5px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Examiner Strategy & Rubric</span>
          </span>
          <span class="text-[11px] text-[#71717A]">IIT Bombay</span>
        </div>

        <div class="recessed-well mb-3.5 border-l-2 !border-l-[#F59E0B]">
          <div class="text-[11.5px] font-semibold text-[#F4F4F6] mb-1">High-Scoring Angle</div>
          <p class="text-[12.5px] text-[#A1A1AA] leading-relaxed">
            ${strategy}
          </p>
        </div>

        <div class="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-2">
          24-Minute Pacing Protocol (Checklist)
        </div>
        <div class="space-y-2">
          ${[
            '1. 3-Min Thumbnail & Perspective Horizon (0–3m)',
            '2. Primary Form & Human Scale (3–11m)',
            '3. Line Weight Hierarchy & Cast Shadows (11–19m)',
            '4. Annotated Callouts & Functional Detailing (19–24m)'
          ].map(step => `
            <label class="recessed-well !py-2.5 !px-3 flex items-center gap-2.5 text-[12.5px] text-[#E4E4E7] cursor-pointer hover:bg-white/[0.02]">
              <input type="checkbox" class="w-4 h-4 accent-[#C8F560] rounded cursor-pointer" />
              <span>${step}</span>
            </label>
          `).join('')}
        </div>
      </section>

      <!-- Bottom Scheduler Action Bar -->
      <div class="recessed-well !rounded-[12px] !p-3.5 flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2 pl-1">
          <span class="text-[28px] font-semibold text-[#F4F4F6] tabular-nums leading-none">${timeStr}</span>
          <span class="text-[12px] text-[#71717A]">timer</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            id="btn-oled-mode"
            class="px-3.5 py-2.5 rounded-full bg-[#23242A] text-[#D4D4D8] text-[12px] font-medium border border-white/[0.07] btn-tactile flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
            OLED
          </button>
          <button
            type="button"
            id="btn-start-drill"
            class="px-5 py-2.5 rounded-full text-[13px] font-semibold btn-tactile ${
              drillRunning
                ? 'bg-[#FECACA] text-[#991B1B] border border-[#F87171]'
                : 'bg-[#F4F4F6] text-[#09090B]'
            }"
          >
            ${drillRunning ? 'Pause Drill' : (drillSecondsRemaining < 1440 ? 'Resume Drill' : 'Start Drill')}
          </button>
        </div>
      </div>

    </div>
  `;

  container.querySelectorAll('[data-q-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeQIndex = parseInt(btn.dataset.qIdx, 10);
      drillSecondsRemaining = 24 * 60;
      drillRunning = false;
      if (drillInterval) clearInterval(drillInterval);
      stopLockScreenTimer();
      playRelayClick();
      renderStudioProctor(container);
    });
  });

  container.querySelector('#studio-prev-day')?.addEventListener('click', () => {
    studioDayIndex = Math.max(0, studioDayIndex - 1);
    drillSecondsRemaining = 24 * 60;
    drillRunning = false;
    if (drillInterval) clearInterval(drillInterval);
    stopLockScreenTimer();
    playRelayClick();
    renderStudioProctor(container);
  });

  container.querySelector('#studio-next-day')?.addEventListener('click', () => {
    const total = daysList.length || 87;
    studioDayIndex = Math.min(total - 1, studioDayIndex + 1);
    drillSecondsRemaining = 24 * 60;
    drillRunning = false;
    if (drillInterval) clearInterval(drillInterval);
    stopLockScreenTimer();
    playRelayClick();
    renderStudioProctor(container);
  });

  container.querySelector('#btn-oled-mode')?.addEventListener('click', () => {
    isOledFullscreen = true;
    playRelayClick();
    renderStudioProctor(container);
  });

  container.querySelector('#btn-start-drill')?.addEventListener('click', () => {
    playRelayClick();
    if (drillRunning) {
      drillRunning = false;
      if (drillInterval) clearInterval(drillInterval);
      stopLockScreenTimer();
      renderStudioProctor(container);
    } else {
      drillRunning = true;
      requestWakeLock();
      startLockScreenTimer('drill', `Part B: ${q.title || 'Studio Drill'}`, () => {});
      drillInterval = setInterval(() => {
        drillSecondsRemaining--;
        if (drillSecondsRemaining <= 0) {
          drillSecondsRemaining = 0;
          drillRunning = false;
          clearInterval(drillInterval);
          releaseWakeLock();
          stopLockScreenTimer();
          playBeep(880, 0.4);
        }
        renderStudioProctor(container);
      }, 1000);
      renderStudioProctor(container);
    }
  });
}
