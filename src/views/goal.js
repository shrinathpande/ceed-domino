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
    <div id="mitraGoalShell" class="w-full max-w-xl md:max-w-4xl mx-auto px-3 sm:px-6 pt-1 pb-16 select-none">
      
      <!-- Sticky Segmented Sub-View Switcher (Apple Inset Segmented Control) -->
      <div class="sticky top-[48px] md:top-[84px] z-30 bg-[#000000]/92 backdrop-blur-xl pt-1 pb-2 mb-3 border-b border-white/[0.08]">
        <div class="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[#121318] border border-white/[0.08]">
          <button
            type="button"
            data-subview="command"
            class="mitra-nav-pill min-h-[40px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'command'
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }"
          >
            <span class="block truncate">Command</span>
          </button>
          <button
            type="button"
            data-subview="clock"
            class="mitra-nav-pill min-h-[40px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'clock'
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }"
          >
            <span class="block truncate">Clock</span>
          </button>
          <button
            type="button"
            data-subview="conquest"
            class="mitra-nav-pill min-h-[40px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'conquest'
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }"
          >
            <span class="block truncate">Conquest</span>
          </button>
          <button
            type="button"
            data-subview="roadmap"
            class="mitra-nav-pill min-h-[40px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'roadmap'
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }"
          >
            <span class="block truncate">54d Plan</span>
          </button>
          <button
            type="button"
            data-subview="scorecard"
            class="mitra-nav-pill min-h-[40px] py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold text-center transition-all ios-spring ${
              _activeSubView === 'scorecard'
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }"
          >
            <span class="block truncate">Scorecard</span>
          </button>
        </div>
      </div>

      <!-- Sub-View Content Container -->
      <div id="mitraSubViewContent" class="space-y-3.5">
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
// SUB-VIEW 1: COMMAND & MERIT CENTER
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

  // Progress relative to 112.5
  const baselinePct = ((MITRA_METADATA.baselineMerit / 112.5) * 100).toFixed(1);
  const currentPct = Math.min(100, Math.max(0, (meritScore / 112.5) * 100)).toFixed(1);
  const targetMinPct = ((MITRA_METADATA.targetMeritMin / 112.5) * 100).toFixed(1);

  return `
    <!-- 1. Hero Command Banner -->
    <div class="bento-card relative overflow-hidden p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
              TARGET: AIR 1
            </span>
            <span class="text-xs font-mono text-[var(--text-secondary)]">IIT Bombay IDC • CEED 2027</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight mt-1">
            MITRA Precision Command Center
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <div class="px-3 py-1.5 rounded-xl bg-black/60 border border-[var(--border-subtle)] text-right">
            <div class="text-[9px] font-mono text-[var(--text-secondary)] uppercase">Campaign Progress</div>
            <div class="text-sm font-mono font-bold text-[var(--domino-accent)]">
              Day ${dayIndex + 1} <span class="text-[var(--text-secondary)] font-normal text-xs">/ ${totalDays}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Countdown Grid -->
      <div class="grid grid-cols-4 gap-2 pt-1 pb-2">
        <div class="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] text-center">
          <div id="liveCdDays" class="text-lg sm:text-2xl font-mono font-black text-[var(--text-primary)]">${countdown.days}</div>
          <div class="text-[9px] sm:text-[10px] font-mono uppercase text-[var(--text-secondary)]">Days</div>
        </div>
        <div class="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] text-center">
          <div id="liveCdHours" class="text-lg sm:text-2xl font-mono font-black text-[var(--text-primary)]">${String(countdown.hours).padStart(2, '0')}</div>
          <div class="text-[9px] sm:text-[10px] font-mono uppercase text-[var(--text-secondary)]">Hours</div>
        </div>
        <div class="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] text-center">
          <div id="liveCdMins" class="text-lg sm:text-2xl font-mono font-black text-[var(--text-primary)]">${String(countdown.minutes).padStart(2, '0')}</div>
          <div class="text-[9px] sm:text-[10px] font-mono uppercase text-[var(--text-secondary)]">Minutes</div>
        </div>
        <div class="p-2 sm:p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] text-center">
          <div id="liveCdSecs" class="text-lg sm:text-2xl font-mono font-black text-[var(--domino-accent)]">${String(countdown.seconds).padStart(2, '0')}</div>
          <div class="text-[9px] sm:text-[10px] font-mono uppercase text-[var(--text-secondary)]">Seconds</div>
        </div>
      </div>

      <div class="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <span>Exam: <strong class="text-[var(--text-primary)]">Sunday, 17 Jan 2027</strong> (09:00 – 12:00 IST)</span>
        <span class="font-mono text-[#F59E0B]">Admit Card: 01 Jan 2027</span>
      </div>
    </div>

    <!-- 2. Interactive Merit Equation Simulator -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">Official Final Merit Simulator</div>
          <div class="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
            Final Score = 0.25 × Part A (150) + 0.75 × Part B (100)
          </div>
        </div>
        <div class="px-2.5 py-1 rounded-full text-xs font-mono font-black" style="background-color: ${tierColor}20; color: ${tierColor}; border: 1px solid ${tierColor}40;">
          ${tierBadge}
        </div>
      </div>

      <!-- Real-Time Score Board -->
      <div class="p-3.5 sm:p-4 rounded-2xl bg-black/70 border border-[var(--border-subtle)] mb-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-mono uppercase text-[var(--text-secondary)]">Projected Merit Score</div>
            <div class="flex items-baseline gap-2 mt-0.5">
              <span id="displayMeritScore" class="text-3xl sm:text-4xl font-mono font-black text-[var(--domino-accent)]">
                ${meritScore.toFixed(2)}
              </span>
              <span class="text-sm font-mono text-[var(--text-secondary)]">/ 112.50 Max</span>
            </div>
            <div class="text-xs font-medium mt-1" style="color: ${tierColor};">${tierLabel}</div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-right">
            <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
              <div class="text-[9px] font-mono text-[var(--text-secondary)]">Part A (0.25×)</div>
              <div id="displayPartATotal" class="text-sm font-mono font-bold text-[var(--text-primary)]">${partATotal} / 150</div>
              <div id="displayPartAContrib" class="text-[10px] font-mono text-[var(--text-secondary)]">+${(0.25 * partATotal).toFixed(2)} pts</div>
            </div>
            <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
              <div class="text-[9px] font-mono text-[#F59E0B]">Part B (0.75×)</div>
              <div id="displayPartBTotal" class="text-sm font-mono font-bold text-[#F59E0B]">${partBTotal} / 100</div>
              <div id="displayPartBContrib" class="text-[10px] font-mono text-[#F59E0B]">+${(0.75 * partBTotal).toFixed(2)} pts</div>
            </div>
          </div>
        </div>

        <!-- Comparative Merit Range Track -->
        <div class="mt-3.5 pt-3 border-t border-[var(--border-subtle)]">
          <div class="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] mb-1">
            <span>Baseline: 63.50</span>
            <span class="text-[#F59E0B]">AIR 1 Gate: 91.00–95.00</span>
            <span>Max: 112.50</span>
          </div>
          <div class="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-800">
            <!-- Baseline Marker -->
            <div class="absolute top-0 bottom-0 w-0.5 bg-zinc-600 z-10" style="left: ${baselinePct}%;"></div>
            <!-- Target Zone -->
            <div class="absolute top-0 bottom-0 bg-[#F59E0B]/20 z-0" style="left: ${targetMinPct}%; width: 5%;"></div>
            <!-- Current Simulation Bar -->
            <div id="meritProgressBar" class="h-full bg-gradient-to-r from-[var(--domino-accent)] to-[#F59E0B] transition-all duration-300" style="width: ${currentPct}%;"></div>
          </div>
        </div>
      </div>

      <!-- 3x Leverage Asymmetry Visualizer -->
      <div class="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 mb-4 flex items-start gap-2.5">
        <div class="p-1.5 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong class="text-[#F59E0B]">3x Leverage Law:</strong> +1 mark in Part B adds <strong class="text-[var(--text-primary)]">+0.75</strong> final merit points. In Part A, +1 mark yields only <strong class="text-[var(--text-primary)]">+0.25</strong>. Part B delivers <strong>75%</strong> of your final All India Rank!
        </div>
      </div>

      <!-- Sectional Sliders / Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <!-- Part A Inputs -->
        <div class="p-3 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] space-y-2.5">
          <div class="text-xs font-mono font-bold text-[var(--text-primary)] uppercase flex justify-between">
            <span>Part A Sections (150 Marks)</span>
            <span class="text-[var(--text-secondary)]">Cutoff Filter</span>
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">NAT (8 Qs × 4M)</span>
              <span id="val_nat" class="font-mono font-bold text-[var(--text-primary)]">${_meritState.nat} / 32</span>
            </div>
            <input type="range" id="slider_nat" min="0" max="32" step="4" value="${_meritState.nat}" class="w-full accent-[var(--domino-accent)] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">MSQ (10 Qs × 4M)</span>
              <span id="val_msq" class="font-mono font-bold text-[var(--text-primary)]">${_meritState.msq} / 40</span>
            </div>
            <input type="range" id="slider_msq" min="0" max="40" step="1" value="${_meritState.msq}" class="w-full accent-[var(--domino-accent)] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">MCQ (26 Qs × 3M)</span>
              <span id="val_mcq" class="font-mono font-bold text-[var(--text-primary)]">${_meritState.mcq} / 78</span>
            </div>
            <input type="range" id="slider_mcq" min="0" max="78" step="1" value="${_meritState.mcq}" class="w-full accent-[var(--domino-accent)] cursor-pointer" />
          </div>
        </div>

        <!-- Part B Inputs -->
        <div class="p-3 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] space-y-2.5">
          <div class="text-xs font-mono font-bold text-[#F59E0B] uppercase flex justify-between">
            <span>Part B Mandatory (100 Marks)</span>
            <span>24m Hard Stop</span>
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">Q1: Sketching & POV</span>
              <span id="val_q1" class="font-mono font-bold text-[#F59E0B]">${_meritState.q1} / 20</span>
            </div>
            <input type="range" id="slider_q1" min="0" max="20" step="1" value="${_meritState.q1}" class="w-full accent-[#F59E0B] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">Q2: 4-Frame Creativity</span>
              <span id="val_q2" class="font-mono font-bold text-[#F59E0B]">${_meritState.q2} / 20</span>
            </div>
            <input type="range" id="slider_q2" min="0" max="20" step="1" value="${_meritState.q2}" class="w-full accent-[#F59E0B] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">Q3: Visual Sensitivity</span>
              <span id="val_q3" class="font-mono font-bold text-[#F59E0B]">${_meritState.q3} / 20</span>
            </div>
            <input type="range" id="slider_q3" min="0" max="20" step="1" value="${_meritState.q3}" class="w-full accent-[#F59E0B] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">Q4: Form Sensitivity</span>
              <span id="val_q4" class="font-mono font-bold text-[#F59E0B]">${_meritState.q4} / 20</span>
            </div>
            <input type="range" id="slider_q4" min="0" max="20" step="1" value="${_meritState.q4}" class="w-full accent-[#F59E0B] cursor-pointer" />
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-[var(--text-secondary)]">Q5: Problem ID & Solutions</span>
              <span id="val_q5" class="font-mono font-bold text-[#F59E0B]">${_meritState.q5} / 20</span>
            </div>
            <input type="range" id="slider_q5" min="0" max="20" step="1" value="${_meritState.q5}" class="w-full accent-[#F59E0B] cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 2: CLOCK & DAILY PROTOCOL MATRIX
// -------------------------------------------------------------
function renderClockSubView() {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMins = now.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMins;
  const isWeekend = now.getDay() === 0 || now.getDay() === 5 || now.getDay() === 6; // Sun, Fri, Sat

  // Find active block
  let activeBlock = null;
  let nextBlock = null;
  for (let i = 0; i < MITRA_TIMETABLE.length; i++) {
    const b = MITRA_TIMETABLE[i];
    if (b.weekendOnly && !isWeekend) continue;
    if (b.weekdayOnly && isWeekend) continue;

    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    let sMin = sh * 60 + sm;
    let eMin = eh * 60 + em;
    if (eMin < sMin) eMin += 24 * 60; // Crosses midnight

    let testCurrent = currentTotalMins;
    if (testCurrent < sMin && sh >= 22) testCurrent += 24 * 60;

    if (testCurrent >= sMin && testCurrent < eMin) {
      activeBlock = b;
      nextBlock = MITRA_TIMETABLE[(i + 1) % MITRA_TIMETABLE.length];
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
    caffeineText = `${ch}h ${cm}m remaining`;
    caffeineClass = 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30';
  }

  const selectedRotation = MITRA_ROTATION_MATRIX.find(r => r.dayIndex === _selectedRotationDay) || MITRA_ROTATION_MATRIX[0];

  return `
    <!-- 1. Live Protocol Clock Hero -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
            <span class="text-base font-bold text-[var(--text-primary)] tracking-tight">Active Solar Circadian Clock</span>
          </div>
          <div class="text-xs font-mono text-[var(--text-secondary)] mt-0.5">Strict 06:00 – 22:00 Diurnal Synchronization</div>
        </div>
        <div id="liveClockDisplay" class="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
          ${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST
        </div>
      </div>

      <!-- Active Block Highlight Banner -->
      <div class="p-4 rounded-2xl bg-black/80 border border-[var(--domino-accent)]/50 shadow-[0_0_15px_var(--domino-accent-glow)] mb-3">
        <div class="flex items-center justify-between text-xs font-mono mb-1">
          <span class="px-2 py-0.5 rounded bg-[var(--domino-accent)] text-[#09090B] font-black uppercase text-[10px]">
            ${activeBlock ? activeBlock.tag : 'REST'} • CURRENT ENGAGEMENT
          </span>
          <span class="text-[var(--text-primary)] font-bold">
            ${activeBlock ? `${activeBlock.start} – ${activeBlock.end}` : 'Night Rest'}
          </span>
        </div>
        <div class="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1">
          ${activeBlock ? activeBlock.name : 'Sleep Fortress (N3 Recovery)'}
        </div>
        <div class="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
          ${activeBlock ? activeBlock.protocol : 'Lights out at 22:00 sharp. 5 complete 90-min cycles for motor skill synthesis.'}
        </div>
      </div>

      <!-- Circadian Triggers Row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div class="p-2.5 rounded-xl border ${caffeineClass}">
          <div class="text-[10px] font-mono uppercase font-bold">13:30 Hard Caffeine Cutoff</div>
          <div class="text-sm font-mono font-bold mt-0.5">${caffeineText}</div>
          <div class="text-[9px] text-[var(--text-secondary)] mt-0.5">Zero caffeine 8.5h pre-sleep</div>
        </div>
        <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[var(--text-secondary)] uppercase">12:45–13:10 NSDR / Nap</div>
          <div class="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">25-Min Spindles</div>
          <div class="text-[9px] text-[var(--text-secondary)] mt-0.5">Locks morning sketching motor pathways</div>
        </div>
        <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[var(--text-secondary)] uppercase">22:00 Sleep Fortress</div>
          <div class="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">8.0h in Bed</div>
          <div class="text-[9px] text-[var(--text-secondary)] mt-0.5">Blue light cutoff at 21:30</div>
        </div>
      </div>
    </div>

    <!-- 2. Seven-Day Subpart Rotation Matrix -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">Seven-Day Subpart Rotation Matrix</div>
          <div class="text-xs text-[var(--text-secondary)] mt-0.5">Zero syllabus leakage across 54 days</div>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
          ${isWeekend ? 'WEEKEND FREELANCE ACTIVE' : 'WEEKDAY FULL SPRINT'}
        </span>
      </div>

      <!-- Day Switcher Pills -->
      <div class="grid grid-cols-7 gap-1 p-1 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] mb-3">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => {
          const isSelected = idx === _selectedRotationDay;
          const isToday = idx === now.getDay();
          return `
            <button
              type="button"
              data-rotation-day="${idx}"
              class="py-1.5 px-1 rounded-lg text-center text-xs font-mono font-bold transition-all ${
                isSelected
                  ? 'bg-[var(--domino-accent)] text-[#09090B] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }"
            >
              <span>${d}</span>
              ${isToday ? `<span class="block w-1 h-1 rounded-full mx-auto mt-0.5 ${isSelected ? 'bg-black' : 'bg-[#F59E0B]'}"></span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Selected Day Rotation Details Card -->
      <div class="p-3.5 rounded-2xl bg-black/60 border border-[var(--border-subtle)] space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-[var(--text-primary)]">${selectedRotation.dayName} Rotation</span>
          <span class="text-xs font-mono text-[#F59E0B]">${selectedRotation.pyqTarget}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
            <div class="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Part A Tier-1 (14:30–15:45)</div>
            <div class="font-medium text-[var(--text-primary)] mt-1">${selectedRotation.partASubpart}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
            <div class="text-[10px] font-mono text-[#F59E0B] uppercase">Part B Rescue Studio (16:00–17:15)</div>
            <div class="font-medium text-[var(--text-primary)] mt-1">${selectedRotation.partBRescue}</div>
          </div>
        </div>

        <div class="p-2.5 rounded-xl ${selectedRotation.isFreelance ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/30' : 'bg-[var(--surface-well)] border border-[var(--border-subtle)]'} text-xs">
          <div class="text-[10px] font-mono ${selectedRotation.isFreelance ? 'text-[#F59E0B]' : 'text-[var(--text-secondary)]'} uppercase">
            Evening Block (17:15–20:15)
          </div>
          <div class="font-medium text-[var(--text-primary)] mt-0.5">${selectedRotation.eveningMode}</div>
        </div>
      </div>
    </div>

    <!-- 3. Full 19-Block Schedule Accordion -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">Full Diurnal Timetable (06:00 – 22:00)</div>
        <button id="btnToggleTimetable" class="text-xs text-[var(--domino-accent)] hover:underline">Toggle Full List</button>
      </div>

      <div id="fullTimetableList" class="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        ${MITRA_TIMETABLE.map(b => {
          let badgeColor = 'bg-zinc-800 text-zinc-300';
          if (b.tag === 'PART A') badgeColor = 'bg-sky-950 text-sky-400 border border-sky-800/40';
          if (b.tag === 'PART B') badgeColor = 'bg-amber-950 text-amber-400 border border-amber-800/40';
          if (b.tag === 'BIO') badgeColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800/40';
          if (b.tag === 'WORK') badgeColor = 'bg-purple-950 text-purple-400 border border-purple-800/40';
          return `
            <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] flex items-start justify-between gap-2 text-xs">
              <div class="space-y-0.5 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-[var(--text-primary)]">${b.start} – ${b.end}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${badgeColor}">${b.tag}</span>
                  <span class="font-semibold text-[var(--text-primary)]">${b.name}</span>
                </div>
                <div class="text-[11px] text-[var(--text-secondary)] leading-tight">${b.protocol}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 3: CONQUEST MATRIX & LAWS
// -------------------------------------------------------------
function renderConquestSubView() {
  return `
    <!-- 1. Chanakya Conquest Matrix -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">Chanakya Conquest Matrix</div>
          <div class="text-xs text-[var(--text-secondary)] mt-0.5">Tiered syllabus mastery based on 10-year weightages</div>
        </div>
      </div>

      <div class="space-y-3">
        ${CHANAKYA_MATRIX.map(tier => `
          <div class="p-3.5 rounded-2xl bg-black/60 border border-[var(--border-subtle)] space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${tier.color};"></span>
                <span class="text-sm font-bold text-[var(--text-primary)]">${tier.tier}</span>
              </div>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style="background-color: ${tier.color}20; color: ${tier.color}; border: 1px solid ${tier.color}40;">
                ${tier.badge}
              </span>
            </div>
            <div class="text-xs text-[var(--text-secondary)]">${tier.description}</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              ${tier.topics.map(t => `
                <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] space-y-1 text-xs">
                  <div class="flex items-start justify-between gap-1">
                    <span class="font-bold text-[var(--text-primary)]">${t.name}</span>
                    <span class="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">${t.weight}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="text-[var(--text-secondary)]">Acc: <strong class="text-[var(--text-primary)]">${t.baselineAcc}</strong></span>
                    <span class="text-[#F59E0B]">Target: ${t.targetAcc}</span>
                    <span class="text-[var(--text-secondary)]">${t.speed}</span>
                  </div>
                  <div class="text-[10.5px] text-[var(--text-secondary)] leading-tight pt-0.5">${t.subtopics}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. Game-Theoretic Scoring Theorems -->
    <div class="bento-card p-4 sm:p-5">
      <div class="text-base font-bold text-[var(--text-primary)] tracking-tight mb-1">5 Game-Theoretic Scoring Theorems</div>
      <div class="text-xs text-[var(--text-secondary)] mb-3">Mathematically proven decision laws for CEED Part A and Part B</div>

      <div class="space-y-2.5">
        ${GAME_THEORY_LAWS.map(law => `
          <div class="p-3 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] space-y-1 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[var(--domino-accent)] text-sm">${law.title}</span>
            </div>
            <div class="font-semibold text-[var(--text-primary)]">${law.rule}</div>
            <div class="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">${law.rationale}</div>
            <div class="text-[11px] font-mono text-[#F59E0B] pt-0.5">Protocol: ${law.protocol}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. Pre-Mortem Failure Shields -->
    <div class="bento-card p-4 sm:p-5">
      <div class="text-base font-bold text-[var(--text-primary)] tracking-tight mb-1">Pre-Mortem Failure Shields</div>
      <div class="text-xs text-[var(--text-secondary)] mb-3">Proactive behavioral firewalls against high-probability breakdown modes</div>

      <div class="space-y-2">
        ${PRE_MORTEM_SHIELDS.map((s, idx) => `
          <div class="p-2.5 rounded-xl bg-black/60 border border-[var(--border-subtle)] flex items-start gap-2 text-xs">
            <span class="w-5 h-5 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 flex items-center justify-center shrink-0 font-mono text-[10px]">
              ${idx + 1}
            </span>
            <div class="space-y-0.5">
              <div class="font-bold text-[var(--text-primary)]">${s.trigger}</div>
              <div class="text-[11px] text-[var(--text-secondary)] leading-relaxed">${s.shield}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 4: 54-DAY ROADMAP & MILESTONES
// -------------------------------------------------------------
function renderRoadmapSubView(dayIndex) {
  return `
    <!-- 1. Phased Battle Calendar -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">54-Day Phased Roadmap</div>
          <div class="text-xs text-[var(--text-secondary)] mt-0.5">From diagnostic baseline to AIR 1 championship execution</div>
        </div>
      </div>

      <div class="space-y-3">
        ${MITRA_ROADMAP_PHASES.map((p, idx) => {
          const isActive = dayIndex >= (idx === 0 ? 0 : idx === 1 ? 19 : idx === 2 ? 37 : idx === 3 ? 50 : 54) &&
                           dayIndex <= (idx === 0 ? 18 : idx === 1 ? 36 : idx === 2 ? 49 : idx === 3 ? 53 : 54);
          return `
            <div class="p-3.5 rounded-2xl border transition-all ${
              isActive
                ? 'bg-black/80 border-[var(--domino-accent)] shadow-[0_0_12px_var(--domino-accent-glow)]'
                : 'bg-black/50 border-[var(--border-subtle)]'
            }">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isActive ? 'bg-[var(--domino-accent)] text-[#09090B]' : 'bg-zinc-800 text-zinc-400'
                  }">
                    ${p.days}
                  </span>
                  <span class="text-sm font-bold text-[var(--text-primary)]">${p.name}</span>
                </div>
                <span class="text-xs font-mono text-[var(--text-secondary)]">${p.dates}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
                  <span class="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Part A KPI</span>
                  <div class="font-medium text-[var(--text-primary)] mt-0.5">${p.partAKPI}</div>
                </div>
                <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
                  <span class="text-[10px] font-mono text-[#F59E0B] uppercase">Part B KPI</span>
                  <div class="font-medium text-[var(--text-primary)] mt-0.5">${p.partBKPI}</div>
                </div>
              </div>

              <div class="mt-2 text-[11px] text-[var(--text-secondary)] font-mono">
                Mock Cadence: <strong class="text-[var(--text-primary)]">${p.mockCadence}</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 2. Exam Day Protocol (Day 54) -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-mono font-black px-2 py-0.5 rounded bg-[#F59E0B] text-black uppercase">DAY 54 PROTOCOL</span>
        <span class="text-xs font-mono text-[var(--text-secondary)]">Sunday, 17 January 2027</span>
      </div>
      <div class="text-base font-bold text-[var(--text-primary)]">Exam Day Solar Synchronization</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[var(--text-secondary)]">05:45 AM</div>
          <div class="font-bold text-[var(--text-primary)] mt-0.5">Wake & Hydrate</div>
          <div class="text-[10px] text-[var(--text-secondary)]">500ml salt water</div>
        </div>
        <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[var(--text-secondary)]">07:00 AM</div>
          <div class="font-bold text-[var(--text-primary)] mt-0.5">Protein Breakfast</div>
          <div class="text-[10px] text-[var(--text-secondary)]">Low GI sustained</div>
        </div>
        <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[#F59E0B]">08:15 AM</div>
          <div class="font-bold text-[#F59E0B] mt-0.5">Caffeine Dose #1</div>
          <div class="text-[10px] text-[var(--text-secondary)]">120mg peak at 09:00</div>
        </div>
        <div class="p-2 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
          <div class="text-[10px] font-mono text-[#10B981]">09:00–12:00</div>
          <div class="font-bold text-[#10B981] mt-0.5">AIR 1 Execution</div>
          <div class="text-[10px] text-[var(--text-secondary)]">Part A 1h + Part B 2h</div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// SUB-VIEW 5: RUBRIC & SCORECARD
// -------------------------------------------------------------
function renderScorecardSubView(dayIndex) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const existingCard = getMitraScorecard(todayStr) || DEFAULT_SCORECARD;

  // Compute total rubric score
  let rubricTotal = 0;
  for (const qKey of Object.keys(_rubricScores)) {
    const qObj = _rubricScores[qKey];
    rubricTotal += qObj.c1 + qObj.c2 + qObj.c3 + qObj.c4;
  }

  return `
    <!-- 1. IIT Bombay 100-Mark Part B Evaluator -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">IIT Bombay 100-Mark Part B Evaluator</div>
          <div class="text-xs text-[var(--text-secondary)] mt-0.5">4 criteria × 5 marks per question (Nightly 20:45 Audit)</div>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-mono text-[var(--text-secondary)]">Rubric Total</div>
          <div id="rubricTotalDisplay" class="text-xl font-mono font-black text-[#F59E0B]">${rubricTotal} / 100</div>
        </div>
      </div>

      <div class="space-y-3 mt-3">
        ${IITB_RUBRIC.map(q => {
          const scores = _rubricScores[q.id] || { c1: 4, c2: 4, c3: 4, c4: 4 };
          const qTotal = scores.c1 + scores.c2 + scores.c3 + scores.c4;
          return `
            <div class="p-3 rounded-xl bg-black/60 border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[var(--text-primary)]">${q.title}</span>
                <span id="score_${q.id}" class="font-mono font-bold text-[#F59E0B]">${qTotal} / 20</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                ${q.criteria.map(c => `
                  <div class="p-2 rounded-lg bg-[var(--surface-well)] border border-[var(--border-subtle)] flex flex-col justify-between">
                    <div>
                      <div class="text-[10px] font-medium text-[var(--text-secondary)] leading-tight">${c.name}</div>
                      <div class="text-[9px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">${c.desc}</div>
                    </div>
                    <div class="flex items-center justify-between mt-2 pt-1 border-t border-[var(--border-subtle)]">
                      <button type="button" class="btn-rubric-dec min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/[0.08] text-white active:scale-95 ios-spring text-base font-bold" data-qid="${q.id}" data-cid="${c.id}">-</button>
                      <span id="val_${q.id}_${c.id}" class="font-mono font-bold text-sm text-[var(--text-primary)]">${scores[c.id]}</span>
                      <button type="button" class="btn-rubric-inc min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white/[0.08] text-white active:scale-95 ios-spring text-base font-bold" data-qid="${q.id}" data-cid="${c.id}">+</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
        <button
          id="btnApplyRubricToScorecard"
          type="button"
          class="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#F59E0B] text-black btn-tactile shadow-sm"
        >
          Transfer ${rubricTotal} Marks to Daily Scorecard
        </button>
      </div>
    </div>

    <!-- 2. MITRA Daily Scorecard Logger -->
    <div class="bento-card p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-base font-bold text-[var(--text-primary)] tracking-tight">MITRA Daily Scorecard Logger</div>
          <div class="text-xs text-[var(--text-secondary)] mt-0.5">Standardized daily telemetry for AI coaching & self-reflection</div>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="btnCopyScorecardYaml" type="button" class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--domino-accent)]">
            Copy YAML
          </button>
          <button id="btnSaveScorecard" type="button" class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--domino-accent)] text-[#09090B]">
            Save Card
          </button>
        </div>
      </div>

      <!-- Form Inputs -->
      <form id="mitraScorecardForm" class="space-y-3 text-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Date</label>
            <input type="date" id="sc_date" value="${existingCard.date || todayStr}" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 font-mono text-[var(--text-primary)] text-base focus:outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Day Number</label>
            <input type="number" id="sc_day" value="${existingCard.dayNumber || dayIndex + 1}" min="1" max="54" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 font-mono text-[var(--text-primary)] text-base focus:outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Sleep (Hours)</label>
            <input type="number" step="0.5" id="sc_sleep" value="${existingCard.sleepHours || 7.5}" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 font-mono text-[var(--text-primary)] text-base focus:outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Rush Errors (&lt;30s)</label>
            <input type="number" id="sc_rush" value="${existingCard.partASync?.rushedErrorsUnder30s || 0}" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5 font-mono text-[var(--text-primary)] text-base focus:outline-none" />
          </div>
        </div>

        <!-- Bio Checks (Ergonomic 44pt Touch Targets) -->
        <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer ios-spring min-h-[44px]">
            <input type="checkbox" id="sc_wake" ${existingCard.wake0600Hit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
            <span class="text-[11px] text-[var(--text-primary)]">06:00 Solar Wake</span>
          </label>
          <label class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer ios-spring min-h-[44px]">
            <input type="checkbox" id="sc_ex" ${existingCard.exercise90mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
            <span class="text-[11px] text-[var(--text-primary)]">90m Exercise</span>
          </label>
          <label class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer ios-spring min-h-[44px]">
            <input type="checkbox" id="sc_med" ${existingCard.meditation15mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
            <span class="text-[11px] text-[var(--text-primary)]">15m Meditation</span>
          </label>
          <label class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer ios-spring min-h-[44px]">
            <input type="checkbox" id="sc_caff" ${existingCard.caffeineCutoff1330Held ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
            <span class="text-[11px] text-[var(--text-primary)]">13:30 Caffeine</span>
          </label>
          <label class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] cursor-pointer ios-spring min-h-[44px] col-span-2 sm:col-span-1">
            <input type="checkbox" id="sc_nap" ${existingCard.powerNap25mHit ? 'checked' : ''} class="w-4 h-4 accent-[var(--domino-accent)]" />
            <span class="text-[11px] text-[var(--text-primary)]">25m Power Nap</span>
          </label>
        </div>

        <!-- Part A & B Scores -->
        <div class="grid grid-cols-2 gap-2">
          <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
            <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Part A Total (/150)</label>
            <input type="number" id="sc_partA" value="${existingCard.partASync?.totalPartA || 114}" min="0" max="150" class="w-full min-h-[44px] bg-black/60 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 font-mono text-base text-[var(--text-primary)] font-bold focus:outline-none" />
          </div>
          <div class="p-2.5 rounded-xl bg-[var(--surface-well)] border border-[var(--border-subtle)]">
            <label class="block text-[10px] font-mono text-[#F59E0B] uppercase mb-1">Part B Total (/100)</label>
            <input type="number" id="sc_partB" value="${existingCard.partBSyncRubric?.totalPartB || 84}" min="0" max="100" class="w-full min-h-[44px] bg-black/60 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 font-mono text-base text-[#F59E0B] font-bold focus:outline-none" />
          </div>
        </div>

        <!-- Error Patterns -->
        <div>
          <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Top 3 Error Patterns Today</label>
          <div class="space-y-1">
            <input type="text" id="sc_err1" value="${existingCard.top3ErrorPatterns?.[0] || ''}" placeholder="1. e.g. Rushed MSQ 3rd option without proof" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none" />
            <input type="text" id="sc_err2" value="${existingCard.top3ErrorPatterns?.[1] || ''}" placeholder="2. e.g. Perspective horizon line curved at edges" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none" />
            <input type="text" id="sc_err3" value="${existingCard.top3ErrorPatterns?.[2] || ''}" placeholder="3. e.g. Off-by-one in hollow cylinder surface count" class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-base sm:text-xs text-[var(--text-primary)] focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">Tomorrow's Single Priority Fix</label>
          <input type="text" id="sc_fix" value="${existingCard.tomorrowSinglePriorityFix || ''}" placeholder="e.g. 22-minute hard pen-lift on Q1 and strict 2-option MSQ ceiling." class="w-full min-h-[44px] bg-[var(--surface-well)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-base sm:text-xs text-[#F59E0B] focus:outline-none" />
        </div>
      </form>
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

    // Toggle full timetable
    const btnToggle = container.querySelector('#btnToggleTimetable');
    const list = container.querySelector('#fullTimetableList');
    btnToggle?.addEventListener('click', () => {
      playRelayClick();
      if (list) {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        btnToggle.textContent = isHidden ? 'Hide List' : 'Show List';
      }
    });
  }

  // Scorecard & Rubric View
  if (_activeSubView === 'scorecard') {
    // Rubric increment / decrement
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

    // Transfer rubric total to Part B input
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

    // Save Scorecard
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

    // Copy Scorecard YAML
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
