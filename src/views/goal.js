// src/views/goal.js
import {
  MITRA_METADATA,
  MITRA_SECTIONS,
  MITRA_TIMETABLE,
  MITRA_ROTATION_MATRIX,
  CHANAKYA_MATRIX,
  GAME_THEORY_LAWS,
  PRE_MORTEM_SHIELDS,
  PREDICTIVE_CHECKLIST_2027,
  MITRA_ROADMAP_PHASES,
  IITB_RUBRIC,
  DEFAULT_SCORECARD
} from '../data/mitra_data.js';
import {
  getState,
  getMitraScorecard,
  saveMitraScorecard,
  getAllMitraScorecards,
  getTimelineMode,
  setTimelineMode
} from '../core/state.js';
import { getDayIndex, getTotalDays, getExamCountdown } from '../utils/dates.js';
import { playRelayClick } from '../utils/sound.js';

let _activeSubView = 'command'; // 'command' | 'clock' | 'conquest' | 'roadmap' | 'scorecard'
let _liveInterval = null;
let _meritState = {
  nat: 26,
  msq: 30,
  mcq: 64,
  q1: 16,
  q2: 16,
  q3: 17,
  q4: 18,
  q5: 17
};
let _rubricScores = {
  q1: { c1: 4, c2: 4, c3: 4, c4: 4 },
  q2: { c1: 4, c2: 4, c3: 4, c4: 4 },
  q3: { c1: 4, c2: 4, c3: 4, c4: 5 },
  q4: { c1: 5, c2: 4, c3: 5, c4: 4 },
  q5: { c1: 4, c2: 4, c3: 5, c4: 4 }
};
let _selectedRotationDay = new Date().getDay(); // 0-6 (Sun-Sat)

export function renderGoalView(container) {
  if (_liveInterval) {
    clearInterval(_liveInterval);
    _liveInterval = null;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const dayIndex = getDayIndex(todayStr);
  const totalDays = getTotalDays();
  const timelineMode = getTimelineMode();
  const isMitra = timelineMode === 'mitra54';

  container.innerHTML = `
    <div id="mitraGoalShell" class="w-full max-w-xl md:max-w-4xl mx-auto px-3 sm:px-6 pt-1 pb-24 select-none">
      
      <!-- Sticky Segmented Sub-View Switcher (Apple Inset Segmented Control) -->
      <div class="sticky top-[48px] md:top-[84px] z-30 bg-[#000000]/92 backdrop-blur-2xl pt-1 pb-2 mb-3 border-b border-white/[0.06]">
        <div class="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[#101116] border border-white/[0.08]">
          <button
            type="button"
            data-subview="command"
            class="mitra-nav-pill min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'command'
                ? 'bg-white/[0.12] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }"
          >
            <span class="block truncate">Command</span>
          </button>
          <button
            type="button"
            data-subview="clock"
            class="mitra-nav-pill min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'clock'
                ? 'bg-white/[0.12] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }"
          >
            <span class="block truncate">Clock</span>
          </button>
          <button
            type="button"
            data-subview="conquest"
            class="mitra-nav-pill min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'conquest'
                ? 'bg-white/[0.12] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }"
          >
            <span class="block truncate">Conquest</span>
          </button>
          <button
            type="button"
            data-subview="roadmap"
            class="mitra-nav-pill min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'roadmap'
                ? 'bg-white/[0.12] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }"
          >
            <span class="block truncate">54d Plan</span>
          </button>
          <button
            type="button"
            data-subview="scorecard"
            class="mitra-nav-pill min-h-[38px] py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'scorecard'
                ? 'bg-white/[0.12] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }"
          >
            <span class="block truncate">Scorecard</span>
          </button>
        </div>
      </div>

      <!-- Sub-View Content Container -->
      <div id="mitraSubViewContent" class="space-y-4">
        ${renderActiveSubView(dayIndex, totalDays, isMitra)}
      </div>

    </div>
  `;

  bindSubViewEvents(container);

  // Live seconds ticker for countdowns and clock
  _liveInterval = setInterval(() => {
    updateLiveTickers(container);
  }, 1000);
}

function renderActiveSubView(dayIndex, totalDays, isMitra) {
  switch (_activeSubView) {
    case 'command':
      return renderCommandSubView(dayIndex, totalDays, isMitra);
    case 'clock':
      return renderClockSubView();
    case 'conquest':
      return renderConquestSubView();
    case 'roadmap':
      return renderRoadmapSubView(dayIndex);
    case 'scorecard':
      return renderScorecardSubView(dayIndex);
    default:
      return renderCommandSubView(dayIndex, totalDays, isMitra);
  }
}

// -------------------------------------------------------------
// SUB-VIEW 1: COMMAND & MERIT CENTER (MINIMALIST LIVE STATUS STRIP + GROUPED INSET)
// -------------------------------------------------------------
function renderCommandSubView(dayIndex, totalDays, isMitra) {
  const countdown = getExamCountdown();
  const partATotal = _meritState.nat + _meritState.msq + _meritState.mcq;
  const partBTotal = _meritState.q1 + _meritState.q2 + _meritState.q3 + _meritState.q4 + _meritState.q5;
  const meritScore = Number((0.25 * partATotal + 0.75 * partBTotal).toFixed(2));

  // Determine Merit Tier
  let tierLabel = 'AIR 1 TARGET EQUILIBRIUM';
  let tierColor = '#F59E0B';
  let tierBadge = 'AIR 1';
  if (meritScore >= 91.0) {
    tierLabel = 'AIR 1 CHAMPIONSHIP ZONE';
    tierColor = '#F59E0B';
    tierBadge = 'AIR 1';
  } else if (meritScore >= 82.0) {
    tierLabel = 'TOP 10 INTERVIEW DOMINANCE';
    tierColor = '#10B981';
    tierBadge = 'TOP 10';
  } else if (meritScore >= 72.0) {
    tierLabel = 'QUALIFYING GATEWAY';
    tierColor = '#0EA5E9';
    tierBadge = 'QUALIFIED';
  } else {
    tierLabel = 'BELOW AIR 1 BENCHMARK';
    tierColor = '#EF4444';
    tierBadge = 'DEFICIT';
  }

  // Progress relative to 112.5 max merit
  const baselinePct = ((MITRA_METADATA.baselineMerit / 112.5) * 100).toFixed(1);
  const currentPct = Math.min(100, Math.max(0, (meritScore / 112.5) * 100)).toFixed(1);
  const targetMinPct = ((MITRA_METADATA.targetMeritMin / 112.5) * 100).toFixed(1);

  return `
    <!-- 1. Minimalist Live Status Strip (HUD) - Zero Chunky Boxes -->
    <div class="apple-inset-group p-4 sm:p-5">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-[#F59E0B]">TARGET: AIR 1</span>
          <span class="text-zinc-600">•</span>
          <span class="text-xs text-zinc-400">IIT Bombay IDC</span>
        </div>
        <div class="text-xs font-mono text-zinc-400">
          Day <strong class="text-white">${dayIndex + 1}</strong> of ${totalDays}
        </div>
      </div>

      <!-- Monolithic Tabular Countdown HUD Strip -->
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1 pb-1">
        <div class="flex items-baseline gap-1.5 font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          <span id="liveCdDays" class="text-white">${countdown.days}</span><span class="text-xs font-medium text-zinc-500 mr-1.5">d</span>
          <span id="liveCdHours" class="text-white">${String(countdown.hours).padStart(2, '0')}</span><span class="text-xs font-medium text-zinc-500 mr-1.5">h</span>
          <span id="liveCdMins" class="text-white">${String(countdown.minutes).padStart(2, '0')}</span><span class="text-xs font-medium text-zinc-500 mr-1.5">m</span>
          <span id="liveCdSecs" class="text-[var(--domino-accent)]">${String(countdown.seconds).padStart(2, '0')}</span><span class="text-xs font-medium text-zinc-500">s</span>
        </div>
        <div class="text-xs text-zinc-400 font-mono">
          Exam: <span class="text-white font-medium">Sunday, 17 Jan 2027</span>
        </div>
      </div>
    </div>

    <!-- 2. Apple Editorial Inset Merit Simulator - Single Unified Surface -->
    <div class="apple-inset-group">
      <!-- Card Header -->
      <div class="p-4 sm:p-5 border-b border-white/[0.06]">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs font-mono uppercase tracking-wider text-zinc-400">Official Merit Equation Simulator</div>
            <div class="flex items-baseline gap-2 mt-1">
              <span id="displayMeritScore" class="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white">
                ${meritScore.toFixed(2)}
              </span>
              <span class="text-sm font-mono text-zinc-500">/ 112.50 Max</span>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="w-2 h-2 rounded-full" style="background-color: ${tierColor};"></span>
              <span class="text-xs font-semibold tracking-wide" style="color: ${tierColor};">${tierLabel}</span>
            </div>
          </div>

          <!-- Sectional Contributions (No nested cards, clean typographic layout) -->
          <div class="text-right space-y-1">
            <div>
              <span class="text-[10px] font-mono text-zinc-400 uppercase">Part A (25%)</span>
              <div id="displayPartATotal" class="text-sm font-mono font-bold text-white">${partATotal} / 150</div>
              <div id="displayPartAContrib" class="text-[11px] font-mono text-zinc-400">+${(0.25 * partATotal).toFixed(2)} pts</div>
            </div>
            <div class="pt-1">
              <span class="text-[10px] font-mono text-[#F59E0B] uppercase">Part B (75%)</span>
              <div id="displayPartBTotal" class="text-sm font-mono font-bold text-[#F59E0B]">${partBTotal} / 100</div>
              <div id="displayPartBContrib" class="text-[11px] font-mono text-[#F59E0B]">+${(0.75 * partBTotal).toFixed(2)} pts</div>
            </div>
          </div>
        </div>

        <!-- Continuous Comparative Merit Track -->
        <div class="mt-4 pt-3 border-t border-white/[0.06]">
          <div class="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span>Baseline: 63.50</span>
            <span class="text-[#F59E0B] font-semibold">AIR 1 Gate: 91.00–95.00</span>
            <span>Max: 112.50</span>
          </div>
          <div class="h-2 w-full bg-zinc-900 rounded-full overflow-hidden relative border border-white/[0.08]">
            <div class="absolute top-0 bottom-0 w-0.5 bg-zinc-600 z-10" style="left: ${baselinePct}%;"></div>
            <div class="absolute top-0 bottom-0 bg-[#F59E0B]/25 z-0" style="left: ${targetMinPct}%; width: 5%;"></div>
            <div id="meritProgressBar" class="h-full bg-gradient-to-r from-[var(--domino-accent)] to-[#F59E0B] transition-all duration-200" style="width: ${currentPct}%;"></div>
          </div>
        </div>

        <!-- 3x Leverage Law Callout -->
        <div class="mt-3.5 flex items-start gap-2.5 text-xs text-zinc-400 bg-[#F59E0B]/[0.08] p-2.5 rounded-xl border border-[#F59E0B]/20">
          <span class="text-[#F59E0B] font-bold shrink-0">3× Leverage:</span>
          <span>+1 mark in Part B adds <strong>+0.75</strong> final rank points (vs +0.25 for Part A). Part B governs 75% of your All India Rank.</span>
        </div>
      </div>

      <!-- Sliders Inset Rows (Clean Hairline Grouped List) -->
      <div class="divide-y divide-white/[0.05]">
        <!-- Part A Section -->
        <div class="p-4 sm:p-5">
          <div class="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-400 mb-3">
            <span>Part A Sections (150 Marks Cutoff Filter)</span>
            <span class="text-zinc-500">Target &ge;114</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">NAT (8 Qs × 4M)</span>
                <span id="val_nat" class="font-mono font-bold text-white">${_meritState.nat} / 32</span>
              </div>
              <input type="range" id="slider_nat" min="0" max="32" step="4" value="${_meritState.nat}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">MSQ (10 Qs × 4M)</span>
                <span id="val_msq" class="font-mono font-bold text-white">${_meritState.msq} / 40</span>
              </div>
              <input type="range" id="slider_msq" min="0" max="40" step="1" value="${_meritState.msq}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">MCQ (26 Qs × 3M)</span>
                <span id="val_mcq" class="font-mono font-bold text-white">${_meritState.mcq} / 78</span>
              </div>
              <input type="range" id="slider_mcq" min="0" max="78" step="1" value="${_meritState.mcq}" class="ios-slider w-full" />
            </div>
          </div>
        </div>

        <!-- Part B Section -->
        <div class="p-4 sm:p-5">
          <div class="flex items-center justify-between text-xs font-mono font-bold uppercase text-[#F59E0B] mb-3">
            <span>Part B Mandatory Studio (100 Marks)</span>
            <span class="text-zinc-500">24m Hard Stop / Question</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">Q1: Sketching & POV</span>
                <span id="val_q1" class="font-mono font-bold text-[#F59E0B]">${_meritState.q1} / 20</span>
              </div>
              <input type="range" id="slider_q1" min="0" max="20" step="1" value="${_meritState.q1}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">Q2: 4-Frame Narrative Creativity</span>
                <span id="val_q2" class="font-mono font-bold text-[#F59E0B]">${_meritState.q2} / 20</span>
              </div>
              <input type="range" id="slider_q2" min="0" max="20" step="1" value="${_meritState.q2}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">Q3: Visual Sensitivity & Type</span>
                <span id="val_q3" class="font-mono font-bold text-[#F59E0B]">${_meritState.q3} / 20</span>
              </div>
              <input type="range" id="slider_q3" min="0" max="20" step="1" value="${_meritState.q3}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">Q4: Form Sensitivity & Ergonomics</span>
                <span id="val_q4" class="font-mono font-bold text-[#F59E0B]">${_meritState.q4} / 20</span>
              </div>
              <input type="range" id="slider_q4" min="0" max="20" step="1" value="${_meritState.q4}" class="ios-slider w-full" />
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-300">Q5: Problem ID & Visual Solutions</span>
                <span id="val_q5" class="font-mono font-bold text-[#F59E0B]">${_meritState.q5} / 20</span>
              </div>
              <input type="range" id="slider_q5" min="0" max="20" step="1" value="${_meritState.q5}" class="ios-slider w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 2: CLOCK & DAILY PROTOCOL (APPLE CALENDAR TIMELINE SPINE)
// -------------------------------------------------------------
function renderClockSubView() {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMins = now.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMins;
  const isWeekend = now.getDay() === 0 || now.getDay() === 5 || now.getDay() === 6; // Sun, Fri, Sat

  // Find active block
  let activeBlock = null;
  let activeIndex = -1;
  for (let i = 0; i < MITRA_TIMETABLE.length; i++) {
    const b = MITRA_TIMETABLE[i];
    if (b.weekendOnly && !isWeekend) continue;
    if (b.weekdayOnly && isWeekend) continue;

    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    let sMin = sh * 60 + sm;
    let eMin = eh * 60 + em;
    if (eMin < sMin) eMin += 24 * 60;

    let testCurrent = currentTotalMins;
    if (testCurrent < sMin && sh >= 22) testCurrent += 24 * 60;

    if (testCurrent >= sMin && testCurrent < eMin) {
      activeBlock = b;
      activeIndex = i;
      break;
    }
  }

  // Caffeine cutoff countdown (13:30)
  const cutoffMins = 13 * 60 + 30;
  const diffCutoff = cutoffMins - currentTotalMins;
  let caffeineText = 'Cutoff Past';
  let caffeineClass = 'text-red-400 bg-red-950/20 border-red-900/30';
  if (diffCutoff > 0) {
    const ch = Math.floor(diffCutoff / 60);
    const cm = diffCutoff % 60;
    caffeineText = `${ch}h ${cm}m left`;
    caffeineClass = 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30';
  }

  const selectedRotation = MITRA_ROTATION_MATRIX.find(r => r.dayIndex === _selectedRotationDay) || MITRA_ROTATION_MATRIX[0];

  return `
    <!-- 1. Circadian Overview HUD -->
    <div class="apple-inset-group p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
            <span class="text-sm font-bold text-white tracking-tight">Active Circadian Clock</span>
          </div>
          <div class="text-xs font-mono text-zinc-400 mt-0.5">06:00 – 22:00 Diurnal Synchronization</div>
        </div>
        <div id="liveClockDisplay" class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/[0.08] text-white">
          ${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST
        </div>
      </div>

      <!-- Current Engagement Banner -->
      <div class="p-3.5 rounded-2xl bg-[#09090C] border border-[var(--domino-accent)]/50 shadow-[0_0_20px_var(--domino-accent-glow)] mb-3">
        <div class="flex items-center justify-between text-xs font-mono mb-1">
          <span class="px-2 py-0.5 rounded bg-[var(--domino-accent)] text-[#09090B] font-bold text-[10px] uppercase">
            ${activeBlock ? activeBlock.tag : 'REST'} • CURRENT ENGAGEMENT
          </span>
          <span class="text-white font-bold">
            ${activeBlock ? `${activeBlock.start} – ${activeBlock.end}` : 'Night Rest'}
          </span>
        </div>
        <div class="text-base sm:text-lg font-bold text-white mt-1">
          ${activeBlock ? activeBlock.name : 'Sleep Fortress (N3 Deep Recovery)'}
        </div>
        <div class="text-xs text-zinc-300 mt-1 leading-relaxed">
          ${activeBlock ? activeBlock.protocol : 'Lights out at 22:00 sharp. 5 complete 90-min cycles for motor skill synthesis.'}
        </div>
      </div>

      <!-- Circadian Thresholds Strip -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-2.5 rounded-xl border ${caffeineClass}">
          <div class="text-[9px] font-mono uppercase font-bold text-zinc-400">13:30 Caffeine Cut</div>
          <div class="text-xs font-mono font-bold mt-0.5">${caffeineText}</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div class="text-[9px] font-mono text-zinc-400 uppercase">12:45 NSDR Nap</div>
          <div class="text-xs font-mono font-bold text-white mt-0.5">25-Min Spindles</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div class="text-[9px] font-mono text-zinc-400 uppercase">22:00 Sleep Lock</div>
          <div class="text-xs font-mono font-bold text-white mt-0.5">8.0h in Bed</div>
        </div>
      </div>
    </div>

    <!-- 2. Seven-Day Subpart Rotation Matrix -->
    <div class="apple-inset-group p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-sm font-bold text-white tracking-tight">Seven-Day Subpart Rotation Matrix</div>
          <div class="text-xs text-zinc-400 mt-0.5">Zero syllabus leakage across 54 days</div>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-zinc-300">
          ${isWeekend ? 'WEEKEND FREELANCE' : 'WEEKDAY SPRINT'}
        </span>
      </div>

      <!-- Day Switcher Pills -->
      <div class="grid grid-cols-7 gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.06] mb-3">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => {
          const isSelected = idx === _selectedRotationDay;
          const isToday = idx === now.getDay();
          return `
            <button
              type="button"
              data-rotation-day="${idx}"
              class="py-1.5 px-1 rounded-lg text-center text-xs font-mono font-bold transition-all ios-spring ${
                isSelected
                  ? 'bg-white/[0.16] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }"
            >
              <span>${d}</span>
              ${isToday ? `<span class="block w-1 h-1 rounded-full mx-auto mt-0.5 ${isSelected ? 'bg-white' : 'bg-[#F59E0B]'}"></span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Selected Day Details Inset List -->
      <div class="apple-inset-group divide-y divide-white/[0.05] bg-black/50">
        <div class="apple-row flex items-center justify-between">
          <span class="text-xs font-bold text-white">${selectedRotation.dayName} Focus</span>
          <span class="text-xs font-mono text-[#F59E0B]">${selectedRotation.pyqTarget}</span>
        </div>
        <div class="apple-row">
          <div class="text-[10px] font-mono text-zinc-400 uppercase">Part A Tier-1 (14:30–15:45)</div>
          <div class="text-xs font-medium text-white mt-0.5">${selectedRotation.partASubpart}</div>
        </div>
        <div class="apple-row">
          <div class="text-[10px] font-mono text-[#F59E0B] uppercase">Part B Rescue Studio (16:00–17:15)</div>
          <div class="text-xs font-medium text-white mt-0.5">${selectedRotation.partBRescue}</div>
        </div>
        <div class="apple-row">
          <div class="text-[10px] font-mono text-zinc-400 uppercase">Evening Block (17:15–20:15)</div>
          <div class="text-xs font-medium text-white mt-0.5">${selectedRotation.eveningMode}</div>
        </div>
      </div>
    </div>

    <!-- 3. Apple Calendar Timeline Spine (06:00 – 22:00 Diurnal Schedule) -->
    <div class="apple-inset-group p-4 sm:p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-sm font-bold text-white tracking-tight">Full Diurnal Timeline</div>
          <div class="text-xs text-zinc-400 mt-0.5">Chronological flow with active block telemetry</div>
        </div>
        <span class="text-xs font-mono text-zinc-500">19 Blocks</span>
      </div>

      <!-- Continuous Timeline Track -->
      <div class="timeline-track space-y-3.5 pl-1 pr-1">
        ${MITRA_TIMETABLE.map((b, idx) => {
          const isActive = idx === activeIndex;
          const [sh, sm] = b.start.split(':').map(Number);
          const blockMin = sh * 60 + sm;
          const isPast = blockMin + 30 < currentTotalMins && !isActive;

          let tagColor = 'text-zinc-400 bg-white/[0.06] border-white/[0.08]';
          if (b.tag === 'PART A') tagColor = 'text-sky-400 bg-sky-950/40 border-sky-800/40';
          if (b.tag === 'PART B') tagColor = 'text-[#F59E0B] bg-amber-950/40 border-amber-800/40';
          if (b.tag === 'BIO') tagColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
          if (b.tag === 'WORK') tagColor = 'text-purple-400 bg-purple-950/40 border-purple-800/40';

          return `
            <div class="flex items-start gap-4 transition-opacity duration-200 ${isActive ? 'opacity-100' : isPast ? 'opacity-40 hover:opacity-80' : 'opacity-85'}">
              <!-- Left: Time Marker (55px width aligned with spine) -->
              <div class="w-[50px] shrink-0 text-right pt-0.5">
                <span class="font-mono text-xs font-bold ${isActive ? 'text-[var(--domino-accent)]' : 'text-zinc-400'}">${b.start}</span>
              </div>

              <!-- Center: Node Dot on Spine -->
              <div class="relative z-10 flex items-center justify-center pt-1.5 shrink-0">
                ${isActive ? `
                  <span class="w-3 h-3 rounded-full bg-[var(--domino-accent)] shadow-[0_0_10px_var(--domino-accent-glow)] ring-2 ring-black"></span>
                ` : `
                  <span class="w-2 h-2 rounded-full bg-zinc-600 ring-2 ring-black"></span>
                `}
              </div>

              <!-- Right: Content Row (No nested dark box, clean typographic hierarchy) -->
              <div class="flex-1 pb-1">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-xs sm:text-sm font-bold ${isActive ? 'text-white' : 'text-zinc-200'}">${b.name}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${tagColor}">${b.tag}</span>
                  <span class="text-[11px] font-mono text-zinc-500">${b.end}</span>
                </div>
                <div class="text-xs text-zinc-400 mt-0.5 leading-relaxed">${b.protocol}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 3: CONQUEST MATRIX & LAWS (APPLE INSET GROUPED ROWS)
// -------------------------------------------------------------
function renderConquestSubView() {
  return `
    <!-- 1. Chanakya Conquest Matrix (Grouped Inset Lists) -->
    <div class="space-y-4">
      <div>
        <h2 class="text-base font-bold text-white tracking-tight">Chanakya Conquest Matrix</h2>
        <p class="text-xs text-zinc-400 mt-0.5">10-year weightage breakdown with strict accuracy gates</p>
      </div>

      ${CHANAKYA_MATRIX.map(tier => `
        <div class="apple-inset-group">
          <!-- Tier Header -->
          <div class="p-3.5 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" style="background-color: ${tier.color};"></span>
              <span class="text-sm font-bold text-white">${tier.tier}</span>
            </div>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.08]" style="color: ${tier.color};">
              ${tier.badge}
            </span>
          </div>

          <!-- Description -->
          <div class="px-4 py-2 text-xs text-zinc-400 border-b border-white/[0.05] bg-black/20">
            ${tier.description}
          </div>

          <!-- Topics Inset Rows (Hairline dividers, no individual nested cards) -->
          <div class="divide-y divide-white/[0.05]">
            ${tier.topics.map(t => `
              <div class="apple-row flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex-1">
                  <div class="flex items-baseline gap-2">
                    <span class="text-xs font-bold text-white">${t.name}</span>
                    <span class="text-[10px] font-mono text-zinc-400">${t.weight}</span>
                  </div>
                  <div class="text-[11px] text-zinc-400 mt-0.5">${t.subtopics}</div>
                </div>

                <div class="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs font-mono">
                  <span class="text-zinc-400">Acc: <strong class="text-white">${t.baselineAcc}</strong></span>
                  <span class="text-[#F59E0B] font-semibold">Target: ${t.targetAcc}</span>
                  <span class="text-zinc-500 text-[10px]">${t.speed}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- 2. Game-Theoretic Scoring Theorems -->
    <div class="apple-inset-group">
      <div class="p-4 border-b border-white/[0.06]">
        <div class="text-sm font-bold text-white tracking-tight">5 Game-Theoretic Scoring Theorems</div>
        <div class="text-xs text-zinc-400 mt-0.5">Mathematically proven decision laws for CEED Part A and Part B</div>
      </div>

      <div class="divide-y divide-white/[0.05]">
        ${GAME_THEORY_LAWS.map(law => `
          <div class="apple-row space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[var(--domino-accent)]">${law.title}</span>
              <span class="text-[10px] font-mono text-[#F59E0B]">Protocol</span>
            </div>
            <div class="text-xs font-medium text-white">${law.rule}</div>
            <div class="text-[11.5px] text-zinc-400 leading-relaxed">${law.rationale}</div>
            <div class="text-[11px] font-mono text-zinc-300 pt-0.5">${law.protocol}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. Pre-Mortem Failure Shields -->
    <div class="apple-inset-group">
      <div class="p-4 border-b border-white/[0.06]">
        <div class="text-sm font-bold text-white tracking-tight">Pre-Mortem Failure Shields</div>
        <div class="text-xs text-zinc-400 mt-0.5">Proactive firewalls against high-probability breakdown modes</div>
      </div>

      <div class="divide-y divide-white/[0.05]">
        ${PRE_MORTEM_SHIELDS.map((s, idx) => `
          <div class="apple-row flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center shrink-0 font-mono text-[10px] mt-0.5">
              ${idx + 1}
            </span>
            <div class="space-y-0.5 flex-1">
              <div class="text-xs font-bold text-white">${s.trigger}</div>
              <div class="text-[11px] text-zinc-400 leading-relaxed">${s.shield}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 4: 54-DAY ROADMAP & MILESTONES (VERTICAL STEPPER WITH ZERO COLLISION)
// -------------------------------------------------------------
function renderRoadmapSubView(dayIndex) {
  return `
    <div class="space-y-4">
      <div>
        <h2 class="text-base font-bold text-white tracking-tight">54-Day Phased Roadmap</h2>
        <p class="text-xs text-zinc-400 mt-0.5">From diagnostic baseline to AIR 1 championship execution</p>
      </div>

      <!-- Vertical Milestone Stepper Container -->
      <div class="apple-inset-group divide-y divide-white/[0.06]">
        ${MITRA_ROADMAP_PHASES.map((p, idx) => {
          const isActive = dayIndex >= (idx === 0 ? 0 : idx === 1 ? 19 : idx === 2 ? 37 : idx === 3 ? 50 : 54) &&
                           dayIndex <= (idx === 0 ? 18 : idx === 1 ? 36 : idx === 2 ? 49 : idx === 3 ? 53 : 54);
          return `
            <div class="p-4 sm:p-5 transition-all ${isActive ? 'bg-white/[0.04]' : ''}">
              <!-- Phase Header: Completely Stacked / Responsive to ELIMINATE Text Collision Bug -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isActive ? 'bg-[var(--domino-accent)] text-[#09090B]' : 'bg-white/[0.08] text-zinc-400'
                  }">
                    ${p.days}
                  </span>
                  <span class="text-sm sm:text-base font-bold text-white">${p.name}</span>
                </div>
                <!-- Clean Date Range Pill (Guaranteed separate line or clean right alignment) -->
                <span class="text-xs font-mono text-zinc-400 self-start sm:self-auto">${p.dates}</span>
              </div>

              <!-- Inline KPI Metrics (No heavy inner box soup) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs">
                <div class="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span class="text-[10px] font-mono text-zinc-400 uppercase">Part A KPI</span>
                  <div class="font-medium text-white mt-0.5 leading-snug">${p.partAKPI}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span class="text-[10px] font-mono text-[#F59E0B] uppercase">Part B KPI</span>
                  <div class="font-medium text-white mt-0.5 leading-snug">${p.partBKPI}</div>
                </div>
              </div>

              <div class="mt-2.5 text-xs text-zinc-400 font-mono">
                Mock Cadence: <strong class="text-white">${p.mockCadence}</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Day 54 Exam Protocol -->
      <div class="apple-inset-group p-4 sm:p-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#F59E0B] text-black uppercase">DAY 54 PROTOCOL</span>
          <span class="text-xs font-mono text-zinc-400">Sunday, 17 January 2027</span>
        </div>
        <div class="text-sm font-bold text-white">Exam Day Solar Synchronization</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div class="text-[10px] font-mono text-zinc-400">05:45 AM</div>
            <div class="font-bold text-white mt-0.5">Solar Ignition</div>
            <div class="text-[10px] text-zinc-400 mt-0.5">Wake, light, salt water</div>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div class="text-[10px] font-mono text-zinc-400">08:00 AM</div>
            <div class="font-bold text-white mt-0.5">Center Gate</div>
            <div class="text-[10px] text-zinc-400 mt-0.5">Biometrics & seated</div>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div class="text-[10px] font-mono text-[#F59E0B]">09:00–10:00</div>
            <div class="font-bold text-[#F59E0B] mt-0.5">Part A Strike</div>
            <div class="text-[10px] text-zinc-400 mt-0.5">NAT &rarr; MSQ &rarr; MCQ</div>
          </div>
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div class="text-[10px] font-mono text-[#F59E0B]">10:00–12:00</div>
            <div class="font-bold text-[#F59E0B] mt-0.5">Part B Mastery</div>
            <div class="text-[10px] text-zinc-400 mt-0.5">Strict 24m per question</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 5: SCORECARD & IIT BOMBAY RUBRIC (ERGONOMIC APPLE INSET)
// -------------------------------------------------------------
function renderScorecardSubView(dayIndex) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const existingCard = getMitraScorecard(todayStr) || DEFAULT_SCORECARD;

  let rubricTotal = 0;
  for (const q of Object.keys(_rubricScores)) {
    rubricTotal += _rubricScores[q].c1 + _rubricScores[q].c2 + _rubricScores[q].c3 + _rubricScores[q].c4;
  }

  return `
    <div class="space-y-4">
      <!-- 1. IIT Bombay 5-Criterion Rubric -->
      <div class="apple-inset-group p-4 sm:p-5">
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="text-sm font-bold text-white tracking-tight">IIT Bombay 5-Criterion Evaluator Rubric</div>
            <div class="text-xs text-zinc-400 mt-0.5">Official grading metric: 5 questions × 4 criteria (max 20/Q)</div>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-mono text-zinc-400 uppercase">Part B Rubric Total</span>
            <div id="rubricTotalDisplay" class="text-lg font-mono font-extrabold text-[#F59E0B]">${rubricTotal} / 100</div>
          </div>
        </div>

        <div class="space-y-3 mt-3">
          ${IITB_RUBRIC.map(q => {
            const scores = _rubricScores[q.id] || { c1: 4, c2: 4, c3: 4, c4: 4 };
            const qTotal = scores.c1 + scores.c2 + scores.c3 + scores.c4;
            return `
              <div class="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-white">${q.title}</span>
                  <span id="score_${q.id}" class="font-mono font-bold text-[#F59E0B]">${qTotal} / 20</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  ${q.criteria.map(c => `
                    <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05] flex flex-col justify-between">
                      <div>
                        <div class="text-[10px] font-semibold text-zinc-300 leading-tight">${c.name}</div>
                        <div class="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">${c.desc}</div>
                      </div>
                      <div class="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.06]">
                        <button type="button" class="btn-rubric-dec min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/[0.08] text-white active:scale-95 ios-spring text-base font-bold" data-qid="${q.id}" data-cid="${c.id}">-</button>
                        <span id="val_${q.id}_${c.id}" class="font-mono font-bold text-sm text-white">${scores[c.id]}</span>
                        <button type="button" class="btn-rubric-inc min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/[0.08] text-white active:scale-95 ios-spring text-base font-bold" data-qid="${q.id}" data-cid="${c.id}">+</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-3.5 pt-3 border-t border-white/[0.06] flex justify-end">
          <button
            id="btnApplyRubricToScorecard"
            type="button"
            class="px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#F59E0B] text-black ios-spring shadow-sm"
          >
            Transfer ${rubricTotal} Marks to Daily Scorecard
          </button>
        </div>
      </div>

      <!-- 2. MITRA Daily Scorecard Logger -->
      <div class="apple-inset-group p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-sm font-bold text-white tracking-tight">MITRA Daily Telemetry Logger</div>
            <div class="text-xs text-zinc-400 mt-0.5">Standardized daily telemetry for AI coaching & self-reflection</div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnCopyScorecardYaml" type="button" class="px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-white/[0.08] text-zinc-300 hover:text-white ios-spring">
              Copy YAML
            </button>
            <button id="btnSaveScorecard" type="button" class="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[var(--domino-accent)] text-[#09090B] ios-spring">
              Save Card
            </button>
          </div>
        </div>

        <!-- Form Inputs -->
        <form id="mitraScorecardForm" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Date</label>
              <input type="date" id="sc_date" value="${existingCard.date || todayStr}" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1.5 font-mono text-white text-base focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Day Number</label>
              <input type="number" id="sc_day" value="${existingCard.dayNumber || dayIndex + 1}" min="1" max="54" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1.5 font-mono text-white text-base focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Sleep (Hours)</label>
              <input type="number" step="0.5" id="sc_sleep" value="${existingCard.sleepHours || 7.5}" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1.5 font-mono text-white text-base focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Rush Errors (&lt;30s)</label>
              <input type="number" id="sc_rush" value="${existingCard.partASync?.rushedErrorsUnder30s || 0}" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1.5 font-mono text-white text-base focus:outline-none" />
            </div>
          </div>

          <!-- Bio Checks (Ergonomic 44pt Touch Targets) -->
          <div class="p-2.5 rounded-2xl bg-black/40 border border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.04] cursor-pointer ios-spring min-h-[44px]">
              <input type="checkbox" id="sc_wake" ${existingCard.wake0600Hit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
              <span class="text-xs text-white">06:00 Solar Wake</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.04] cursor-pointer ios-spring min-h-[44px]">
              <input type="checkbox" id="sc_ex" ${existingCard.exercise90mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
              <span class="text-xs text-white">90m Exercise</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.04] cursor-pointer ios-spring min-h-[44px]">
              <input type="checkbox" id="sc_med" ${existingCard.meditation15mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
              <span class="text-xs text-white">15m Meditation</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.04] cursor-pointer ios-spring min-h-[44px]">
              <input type="checkbox" id="sc_caff" ${existingCard.caffeineCutoff1330Held ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
              <span class="text-xs text-white">13:30 Caffeine Cut</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.04] cursor-pointer ios-spring min-h-[44px] col-span-2 sm:col-span-1">
              <input type="checkbox" id="sc_nap" ${existingCard.powerNap25mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
              <span class="text-xs text-white">25m NSDR Nap</span>
            </label>
          </div>

          <!-- Part A & B Scores -->
          <div class="grid grid-cols-2 gap-2">
            <div class="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Part A Total (/150)</label>
              <input type="number" id="sc_partA" value="${existingCard.partASync?.totalPartA || 114}" min="0" max="150" class="w-full min-h-[44px] bg-black/60 border border-white/[0.08] rounded-lg px-2.5 py-1 font-mono text-base text-white font-bold focus:outline-none" />
            </div>
            <div class="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <label class="block text-[10px] font-mono text-[#F59E0B] uppercase mb-1">Part B Total (/100)</label>
              <input type="number" id="sc_partB" value="${existingCard.partBSyncRubric?.totalPartB || 84}" min="0" max="100" class="w-full min-h-[44px] bg-black/60 border border-white/[0.08] rounded-lg px-2.5 py-1 font-mono text-base text-[#F59E0B] font-bold focus:outline-none" />
            </div>
          </div>

          <!-- Error Patterns -->
          <div>
            <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Top 3 Error Patterns Today</label>
            <div class="space-y-1.5">
              <input type="text" id="sc_err1" value="${existingCard.top3ErrorPatterns?.[0] || ''}" placeholder="1. e.g. Rushed MSQ 3rd option without proof" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1 text-base text-white focus:outline-none" />
              <input type="text" id="sc_err2" value="${existingCard.top3ErrorPatterns?.[1] || ''}" placeholder="2. e.g. Perspective horizon line curved at edges" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1 text-base text-white focus:outline-none" />
              <input type="text" id="sc_err3" value="${existingCard.top3ErrorPatterns?.[2] || ''}" placeholder="3. e.g. Off-by-one in hollow cylinder surface count" class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1 text-base text-white focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Tomorrow's Single Priority Fix</label>
            <input type="text" id="sc_fix" value="${existingCard.tomorrowSinglePriorityFix || ''}" placeholder="e.g. 22-minute hard pen-lift on Q1 and strict 2-option MSQ ceiling." class="w-full min-h-[44px] bg-black/50 border border-white/[0.08] rounded-xl px-2.5 py-1 text-base text-[#F59E0B] font-medium focus:outline-none" />
          </div>
        </form>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// EVENT BINDINGS & LIVE TICKERS
// -------------------------------------------------------------
function bindSubViewEvents(container) {
  // Pinned sub-view switcher buttons
  container.querySelectorAll('.mitra-nav-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      playRelayClick();
      const targetSub = btn.getAttribute('data-subview');
      if (targetSub && targetSub !== _activeSubView) {
        _activeSubView = targetSub;
        renderGoalView(container);
      }
    });
  });

  // Merit Simulator Sliders
  if (_activeSubView === 'command') {
    const updateMeritBoard = () => {
      const nat = Number(container.querySelector('#slider_nat')?.value || 0);
      const msq = Number(container.querySelector('#slider_msq')?.value || 0);
      const mcq = Number(container.querySelector('#slider_mcq')?.value || 0);
      const q1 = Number(container.querySelector('#slider_q1')?.value || 0);
      const q2 = Number(container.querySelector('#slider_q2')?.value || 0);
      const q3 = Number(container.querySelector('#slider_q3')?.value || 0);
      const q4 = Number(container.querySelector('#slider_q4')?.value || 0);
      const q5 = Number(container.querySelector('#slider_q5')?.value || 0);

      _meritState = { nat, msq, mcq, q1, q2, q3, q4, q5 };

      const partA = nat + msq + mcq;
      const partB = q1 + q2 + q3 + q4 + q5;
      const finalMerit = Number((0.25 * partA + 0.75 * partB).toFixed(2));

      // Update text values
      const elMerit = container.querySelector('#displayMeritScore');
      if (elMerit) elMerit.textContent = finalMerit.toFixed(2);

      const elPartA = container.querySelector('#displayPartATotal');
      if (elPartA) elPartA.textContent = `${partA} / 150`;

      const elPartAContrib = container.querySelector('#displayPartAContrib');
      if (elPartAContrib) elPartAContrib.textContent = `+${(0.25 * partA).toFixed(2)} pts`;

      const elPartB = container.querySelector('#displayPartBTotal');
      if (elPartB) elPartB.textContent = `${partB} / 100`;

      const elPartBContrib = container.querySelector('#displayPartBContrib');
      if (elPartBContrib) elPartBContrib.textContent = `+${(0.75 * partB).toFixed(2)} pts`;

      const elProg = container.querySelector('#meritProgressBar');
      if (elProg) {
        const pct = Math.min(100, Math.max(0, (finalMerit / 112.5) * 100));
        elProg.style.width = `${pct.toFixed(1)}%`;
      }

      const valNat = container.querySelector('#val_nat');
      if (valNat) valNat.textContent = `${nat} / 32`;
      const valMsq = container.querySelector('#val_msq');
      if (valMsq) valMsq.textContent = `${msq} / 40`;
      const valMcq = container.querySelector('#val_mcq');
      if (valMcq) valMcq.textContent = `${mcq} / 78`;

      const valQ1 = container.querySelector('#val_q1');
      if (valQ1) valQ1.textContent = `${q1} / 20`;
      const valQ2 = container.querySelector('#val_q2');
      if (valQ2) valQ2.textContent = `${q2} / 20`;
      const valQ3 = container.querySelector('#val_q3');
      if (valQ3) valQ3.textContent = `${q3} / 20`;
      const valQ4 = container.querySelector('#val_q4');
      if (valQ4) valQ4.textContent = `${q4} / 20`;
      const valQ5 = container.querySelector('#val_q5');
      if (valQ5) valQ5.textContent = `${q5} / 20`;
    };

    ['nat', 'msq', 'mcq', 'q1', 'q2', 'q3', 'q4', 'q5'].forEach(id => {
      container.querySelector(`#slider_${id}`)?.addEventListener('input', updateMeritBoard);
    });
  }

  // Clock View Subpart Day Rotation selector
  if (_activeSubView === 'clock') {
    container.querySelectorAll('[data-rotation-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        playRelayClick();
        const dIdx = Number(btn.getAttribute('data-rotation-day'));
        _selectedRotationDay = dIdx;
        renderGoalView(container);
      });
    });
  }

  // Scorecard & Rubric View
  if (_activeSubView === 'scorecard') {
    container.querySelectorAll('.btn-rubric-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        playRelayClick();
        const qid = btn.getAttribute('data-qid');
        const cid = btn.getAttribute('data-cid');
        if (_rubricScores[qid] && _rubricScores[qid][cid] < 5) {
          _rubricScores[qid][cid]++;
          updateRubricDisplay(container, qid, cid);
        }
      });
    });

    container.querySelectorAll('.btn-rubric-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        playRelayClick();
        const qid = btn.getAttribute('data-qid');
        const cid = btn.getAttribute('data-cid');
        if (_rubricScores[qid] && _rubricScores[qid][cid] > 0) {
          _rubricScores[qid][cid]--;
          updateRubricDisplay(container, qid, cid);
        }
      });
    });

    container.querySelector('#btnApplyRubricToScorecard')?.addEventListener('click', () => {
      playRelayClick();
      let total = 0;
      for (const q of Object.keys(_rubricScores)) {
        total += _rubricScores[q].c1 + _rubricScores[q].c2 + _rubricScores[q].c3 + _rubricScores[q].c4;
      }
      const partBInput = container.querySelector('#sc_partB');
      if (partBInput) partBInput.value = total;
      alert(`Applied ${total} Part B marks to today's scorecard.`);
    });

    container.querySelector('#btnSaveScorecard')?.addEventListener('click', () => {
      playRelayClick();
      const date = container.querySelector('#sc_date')?.value || new Date().toISOString().slice(0, 10);
      const dayNumber = Number(container.querySelector('#sc_day')?.value || 1);
      const sleepHours = Number(container.querySelector('#sc_sleep')?.value || 7.5);
      const rushedErrorsUnder30s = Number(container.querySelector('#sc_rush')?.value || 0);

      const wake0600Hit = !!container.querySelector('#sc_wake')?.checked;
      const exercise90mHit = !!container.querySelector('#sc_ex')?.checked;
      const meditation15mHit = !!container.querySelector('#sc_med')?.checked;
      const caffeineCutoff1330Held = !!container.querySelector('#sc_caff')?.checked;
      const powerNap25mHit = !!container.querySelector('#sc_nap')?.checked;

      const totalPartA = Number(container.querySelector('#sc_partA')?.value || 0);
      const totalPartB = Number(container.querySelector('#sc_partB')?.value || 0);
      const projectedMerit = Number((0.25 * totalPartA + 0.75 * totalPartB).toFixed(2));

      const top3ErrorPatterns = [
        container.querySelector('#sc_err1')?.value || '',
        container.querySelector('#sc_err2')?.value || '',
        container.querySelector('#sc_err3')?.value || ''
      ].filter(Boolean);

      const tomorrowSinglePriorityFix = container.querySelector('#sc_fix')?.value || '';

      const card = {
        date,
        dayNumber,
        sleepHours,
        wake0600Hit,
        exercise90mHit,
        meditation15mHit,
        caffeineCutoff1330Held,
        powerNap25mHit,
        partASync: {
          totalPartA,
          rushedErrorsUnder30s
        },
        partBSyncRubric: {
          totalPartB,
          rubricBreakdown: _rubricScores
        },
        projectedMerit,
        top3ErrorPatterns,
        tomorrowSinglePriorityFix
      };

      saveMitraScorecard(date, card);
      alert(`MITRA Scorecard for Day ${dayNumber} (${date}) saved successfully!`);
    });

    container.querySelector('#btnCopyScorecardYaml')?.addEventListener('click', () => {
      playRelayClick();
      const date = container.querySelector('#sc_date')?.value || new Date().toISOString().slice(0, 10);
      const dayNumber = container.querySelector('#sc_day')?.value || 1;
      const sleepHours = container.querySelector('#sc_sleep')?.value || 7.5;
      const wake0600Hit = !!container.querySelector('#sc_wake')?.checked;
      const exercise90mHit = !!container.querySelector('#sc_ex')?.checked;
      const meditation15mHit = !!container.querySelector('#sc_med')?.checked;
      const caffeineCutoff1330Held = !!container.querySelector('#sc_caff')?.checked;
      const powerNap25mHit = !!container.querySelector('#sc_nap')?.checked;
      const totalPartA = container.querySelector('#sc_partA')?.value || 0;
      const totalPartB = container.querySelector('#sc_partB')?.value || 0;
      const rush = container.querySelector('#sc_rush')?.value || 0;
      const projectedMerit = (0.25 * Number(totalPartA) + 0.75 * Number(totalPartB)).toFixed(2);
      const err1 = container.querySelector('#sc_err1')?.value || '';
      const err2 = container.querySelector('#sc_err2')?.value || '';
      const err3 = container.querySelector('#sc_err3')?.value || '';
      const fix = container.querySelector('#sc_fix')?.value || '';

      const yaml = `date: ${date}
day_number: ${dayNumber}/54
sleep_hours: ${sleepHours}
wake_0600_hit: ${wake0600Hit}
exercise_90m_hit: ${exercise90mHit}
meditation_15m_hit: ${meditation15mHit}
caffeine_cutoff_1330_held: ${caffeineCutoff1330Held}
power_nap_25m_hit: ${powerNap25mHit}
part_a_sync:
  total_part_a: "${totalPartA}/150"
  rushed_errors_under_30s: ${rush}
part_b_sync_rubric:
  total_part_b: "${totalPartB}/100"
  hard_stop_24m_held: true
projected_merit_score: "${projectedMerit}"
top_3_error_patterns_today:
  - "${err1}"
  - "${err2}"
  - "${err3}"
tomorrow_single_priority_fix: "${fix}"
`;
      navigator.clipboard.writeText(yaml).then(() => {
        alert('YAML scorecard copied to clipboard! Ready to paste into AI coaching prompt.');
      });
    });
  }
}

function updateRubricDisplay(container, qid, cid) {
  const valEl = container.querySelector(`#val_${qid}_${cid}`);
  if (valEl) valEl.textContent = _rubricScores[qid][cid];

  const qScores = _rubricScores[qid];
  const qTotal = qScores.c1 + qScores.c2 + qScores.c3 + qScores.c4;
  const qTotalEl = container.querySelector(`#score_${qid}`);
  if (qTotalEl) qTotalEl.textContent = `${qTotal} / 20`;

  let rubricTotal = 0;
  for (const q of Object.keys(_rubricScores)) {
    rubricTotal += _rubricScores[q].c1 + _rubricScores[q].c2 + _rubricScores[q].c3 + _rubricScores[q].c4;
  }
  const totalEl = container.querySelector('#rubricTotalDisplay');
  if (totalEl) totalEl.textContent = `${rubricTotal} / 100`;

  const btnApply = container.querySelector('#btnApplyRubricToScorecard');
  if (btnApply) btnApply.textContent = `Transfer ${rubricTotal} Marks to Daily Scorecard`;
}

function updateLiveTickers(container) {
  if (_activeSubView === 'command') {
    const cd = getExamCountdown();
    const dEl = container.querySelector('#liveCdDays');
    if (dEl) dEl.textContent = cd.days;
    const hEl = container.querySelector('#liveCdHours');
    if (hEl) hEl.textContent = String(cd.hours).padStart(2, '0');
    const mEl = container.querySelector('#liveCdMins');
    if (mEl) mEl.textContent = String(cd.minutes).padStart(2, '0');
    const sEl = container.querySelector('#liveCdSecs');
    if (sEl) sEl.textContent = String(cd.seconds).padStart(2, '0');
  } else if (_activeSubView === 'clock') {
    const now = new Date();
    const clockEl = container.querySelector('#liveClockDisplay');
    if (clockEl) {
      clockEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;
    }
  }
}
