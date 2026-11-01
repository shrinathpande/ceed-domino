import partBData from '../data/part_b_questions.json';
import { playRelayClick } from '../utils/sound.js';
import { renderStatusPill } from '../components/status-pill.js';

let studioDayIndex = 10; // 0-indexed (Day 11 default)
let activeQIndex = 0;
let activePane = 'PROMPT'; // 'PROMPT' | 'STRATEGY'
let isOledFullscreen = false;

export function renderStudioProctor(container) {
  const daysList = Array.isArray(partBData) ? partBData : (partBData.days || []);
  const dayObj = daysList[studioDayIndex] || {
    day: studioDayIndex + 1,
    questions: [
      {
        category: 'SKETCH',
        title: 'Sketching (POV & Perspective)',
        marks: 20,
        durationMins: 24,
        scenario: 'A vegetable vendor pushing a four-wheeled wooden handcart up a steep rain-slicked flyover slope is helped from behind by two schoolboys in uniform who push the back of the cart with all their strength.',
        task: 'Sketch the complete scene from a low 3/4 rear-quarter street-level perspective emphasizing muscular effort and rain splashes. Use only black/HB-series pencils; do not use colours.',
        strategy: 'Prioritize speed, primary form, human scale, and dynamic diagonal perspective lines before rendering textures.'
      }
    ]
  };

  const questions = dayObj.questions || [];
  const q = questions[activeQIndex] || questions[0];

  if (isOledFullscreen) {
    container.innerHTML = `
      <div id="oled-fullscreen" class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center select-none cursor-pointer">
        <div class="font-pixel-display text-[76px] text-[#F4F4F6] leading-none mb-6">24:00</div>
        <p class="text-[14px] text-[#A1A1AA] max-w-[320px] leading-relaxed">${q.task || q.scenario}</p>
        <span class="mt-8 text-[11px] uppercase tracking-widest text-[#52525B]">Tap anywhere to exit OLED clock</span>
      </div>
    `;
    container.querySelector('#oled-fullscreen')?.addEventListener('click', () => {
      isOledFullscreen = false;
      playRelayClick();
      renderStudioProctor(container);
    });
    return;
  }

  const isPromptActive = activePane === 'PROMPT';

  container.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2 pb-28 select-none">

      <!-- Day Stepper & Q1-Q5 Pill Switcher -->
      <div class="flex items-center justify-between gap-2 mb-4">
        <div class="recessed-well !py-2 !px-3 flex items-center gap-3">
          <button type="button" id="studio-prev-day" class="text-[#A1A1AA] hover:text-white btn-tactile">‹</button>
          <span class="text-[13px] font-medium text-[#F4F4F6] tabular-nums">Day ${studioDayIndex + 1} of 87</span>
          <button type="button" id="studio-next-day" class="text-[#A1A1AA] hover:text-white btn-tactile">›</button>
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

      <!-- Reference 8 (Jose Maria UI): Asymmetric Horizontal Peek Card Layout (82% / 18%) -->
      <div class="flex items-stretch gap-2.5 h-[470px] mb-4">
        
        <!-- Left Pane: Question Prompt -->
        <div
          id="pane-prompt"
          style="flex: ${isPromptActive ? '82' : '18'};"
          class="transition-all duration-300 ease-out overflow-hidden ${
            isPromptActive
              ? 'bento-card flex flex-col justify-between'
              : 'rounded-[26px] bg-[#2A282E] border border-[#3A3740] flex items-center justify-center cursor-pointer'
          }"
        >
          ${isPromptActive ? `
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                ${renderStatusPill('IN_PROGRESS').replace('In Progress', `${q.marks || 20} Marks • ${q.durationMins || 24}m`)}
                <span class="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#71717A]">${q.category || 'SKETCH'}</span>
              </div>

              <h2 class="text-[20px] font-semibold text-[#F4F4F6] leading-snug mb-3.5">
                ${q.title || 'Part B Studio Problem'}
              </h2>

              <p class="text-[14px] text-[#D4D4D8] leading-[1.58] mb-4">
                ${q.scenario || ''}
              </p>

              <!-- Structured Task Callout Well -->
              <div class="recessed-well border-l-2 !border-l-[#C8F560]">
                <div class="text-[11px] font-semibold uppercase tracking-wider text-[#C8F560] mb-1">Mandatory Task</div>
                <p class="text-[13.5px] text-[#F4F4F6] leading-[1.5]">
                  ${q.task || ''}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[12px] text-[#71717A]">
              <span>IIT Bombay Answer Sheet Drill</span>
              <button type="button" id="jump-strategy" class="text-[#F4F4F6] font-medium">Strategy tab →</button>
            </div>
          ` : `
            <span class="-rotate-90 whitespace-nowrap text-[14px] font-medium text-[#E4E4E7] tracking-tight">
              Question Prompt
            </span>
          `}
        </div>

        <!-- Right Pane: Examiner Strategy & 24m Pacing Checklist (Reference 8 Warm Stone Peek Tab) -->
        <div
          id="pane-strategy"
          style="flex: ${!isPromptActive ? '82' : '18'};"
          class="transition-all duration-300 ease-out overflow-hidden ${
            !isPromptActive
              ? 'bento-card flex flex-col justify-between'
              : 'rounded-[26px] bg-[#2A282E] border border-[#3A3740] flex items-center justify-center cursor-pointer hover:bg-[#323038]'
          }"
        >
          ${!isPromptActive ? `
            <div>
              <div class="flex items-center justify-between mb-3">
                ${renderStatusPill('PENDING').replace('Pending', 'Examiner Strategy')}
                <span class="text-[11px] text-[#71717A]">Rubric Protocol</span>
              </div>

              <div class="recessed-well mb-4 border-l-2 !border-l-[#F59E0B]">
                <div class="text-[12px] font-semibold text-[#F4F4F6] mb-1">High-Scoring Angle</div>
                <p class="text-[13px] text-[#A1A1AA] leading-relaxed">
                  ${q.strategy || 'Prioritize speed, primary form, human scale, and functional callouts.'}
                </p>
              </div>

              <div class="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] mb-2">24-Minute Pacing Protocol</div>
              <div class="space-y-2">
                ${[
                  '1. 3-Min Thumbnail & Perspective Grid',
                  '2. Primary Form & Human Scale (8m)',
                  '3. Line Weight Hierarchy & Shadows (8m)',
                  '4. Annotated Callouts & Details (5m)'
                ].map(step => `
                  <label class="recessed-well !py-2.5 !px-3 flex items-center gap-2.5 text-[13px] text-[#E4E4E7] cursor-pointer">
                    <input type="checkbox" class="w-4 h-4 accent-[#C8F560] rounded" />
                    <span>${step}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[12px] text-[#71717A]">
              <span>Standard 24m Slot</span>
              <button type="button" id="jump-prompt" class="text-[#F4F4F6] font-medium">← Prompt tab</button>
            </div>
          ` : `
            <span class="-rotate-90 whitespace-nowrap text-[14px] font-medium text-[#E4E4E7] tracking-tight">
              Strategy & Checklist
            </span>
          `}
        </div>

      </div>

      <!-- Reference 7: Recessed Bottom Scheduler Bar -->
      <div class="recessed-well !rounded-[24px] !p-3.5 flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2 pl-1">
          <span class="text-[28px] font-semibold text-[#F4F4F6] tabular-nums leading-none">24:00</span>
          <span class="text-[12px] text-[#71717A]">countdown</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            id="btn-oled-mode"
            class="px-3.5 py-2.5 rounded-full bg-[#23242A] text-[#D4D4D8] text-[12px] font-medium border border-white/[0.07] btn-tactile"
          >
            ⛶ OLED
          </button>
          <button
            type="button"
            id="btn-start-drill"
            class="px-5 py-2.5 rounded-full bg-[#F4F4F6] text-[#09090B] text-[13px] font-semibold btn-tactile"
          >
            Start Drill
          </button>
        </div>
      </div>

    </div>
  `;

  container.querySelector('#pane-prompt')?.addEventListener('click', () => {
    if (activePane !== 'PROMPT') {
      activePane = 'PROMPT';
      playRelayClick();
      renderStudioProctor(container);
    }
  });
  container.querySelector('#pane-strategy')?.addEventListener('click', () => {
    if (activePane !== 'STRATEGY') {
      activePane = 'STRATEGY';
      playRelayClick();
      renderStudioProctor(container);
    }
  });
  container.querySelector('#jump-strategy')?.addEventListener('click', e => {
    e.stopPropagation();
    activePane = 'STRATEGY';
    playRelayClick();
    renderStudioProctor(container);
  });
  container.querySelector('#jump-prompt')?.addEventListener('click', e => {
    e.stopPropagation();
    activePane = 'PROMPT';
    playRelayClick();
    renderStudioProctor(container);
  });
  container.querySelectorAll('[data-q-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeQIndex = parseInt(btn.dataset.qIdx, 10);
      playRelayClick();
      renderStudioProctor(container);
    });
  });
  container.querySelector('#btn-oled-mode')?.addEventListener('click', () => {
    isOledFullscreen = true;
    playRelayClick();
    renderStudioProctor(container);
  });
}