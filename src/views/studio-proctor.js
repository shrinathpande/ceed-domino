/**
 * Studio Proctor HUD & Exam Engine — CEED 2027 Timed Practice Terminal.
 * Features:
 * 1. Part B 120m Studio HUD with automated 24-minute slot transitions & audio cues
 * 2. Part A 40m Daily Sliced Questions with Game-Theoretic EV warnings & key check
 * 3. 15m Self-Evaluation Rubric (100 marks Part B) & Error Taxonomy Logger
 * 4. Game Theory Strategy Blueprint reference
 */
import partBData from '../data/part_b_questions.json';
import partAData from '../data/part_a_questions.json';
import scheduleData from '../data/daily_schedule.json';
import gameTheoryData from '../data/game_theory.json';

import { getState, ensureDayRecord, saveExamSession, getExamLog } from '../core/state.js';
import { toggleDomino } from '../core/streak.js';
import { getDayIndex, getPhaseLabel, getCurrentDateStr } from '../utils/dates.js';
import { icon } from '../icons/index.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap, vibrateCompletion, showNotification } from '../core/notifications.js';
import { showToast } from '../components/header.js';

let _activeDate = null;
let _currentTab = 'partB'; // 'partB' | 'partA' | 'eval' | 'gameTheory'
let _partBSlot = 1; // 1..5
let _container = null;
let _onBack = null;

// Proctor Timer State
let _proctorInterval = null;
let _proctorTotalSeconds = 120 * 60; // 120 minutes
let _proctorRemainingSeconds = 120 * 60;
let _isProctorRunning = false;
let _lastSlotNotified = 1;

/** Render the Studio Proctor View */
export function renderStudioProctor(container, onBack, initialDate) {
  _container = container;
  _onBack = onBack;
  _activeDate = initialDate || _activeDate || getCurrentDateStr();

  drawView();
}

function getDayInfo(dateStr) {
  const dayIndex = getDayIndex(dateStr);
  const dayNumber = Math.max(1, Math.min(88, dayIndex + 1));
  
  // Find schedule entry
  const schedule = scheduleData.find((s) => s.day === dayNumber) || scheduleData[0];
  const partB = partBData.find((p) => p.day === dayNumber) || partBData[0];
  
  // Get sliced Part A questions
  const partAQuestions = (schedule.partAQuestions || []).map((id) => {
    return partAData.find((q) => q.id === id);
  }).filter(Boolean);

  return {
    dayIndex,
    dayNumber,
    dateStr,
    phase: getPhaseLabel(dayIndex),
    schedule,
    partB,
    partAQuestions,
  };
}

function drawView() {
  const dayInfo = getDayInfo(_activeDate);
  const examLog = getExamLog(_activeDate) || {};

  _container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28 font-sans">
      <!-- Top Navigation & Terminal Bar -->
      <div class="flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono">
        <button id="proctorBackBtn" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--chart-accent)] hover:underline touch-manipulation">
          <span class="w-4 h-4">${icon('arrowLeft')}</span>
          DASHBOARD
        </button>

        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
            DAY ${dayInfo.dayNumber} OF 87
          </span>
          <span class="text-[11px] text-[var(--muted)] hidden sm:inline">${dayInfo.phase}</span>
        </div>
      </div>

      <!-- Mode Selector Tabs -->
      <nav class="flex border-b border-[var(--border)] font-mono text-xs overflow-x-auto gap-1" role="tablist">
        <button data-tab="partB" class="proctor-tab py-2.5 px-3 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'partB'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          PART B: 120m STUDIO
        </button>
        <button data-tab="partA" class="proctor-tab py-2.5 px-3 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'partA'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          PART A: 40m SPRINT (${dayInfo.partAQuestions.length}Q)
        </button>
        <button data-tab="eval" class="proctor-tab py-2.5 px-3 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'eval'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          EVALUATION & ERRORS
        </button>
        <button data-tab="gameTheory" class="proctor-tab py-2.5 px-3 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'gameTheory'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          GAME THEORY
        </button>
      </nav>

      <!-- Tab Content Area -->
      <div id="tabContent"></div>
    </div>
  `;

  // Bind top nav
  _container.querySelector('#proctorBackBtn').addEventListener('click', () => {
    if (_onBack) _onBack();
  });

  _container.querySelectorAll('.proctor-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      _currentTab = btn.dataset.tab;
      drawView();
    });
  });

  // Render active tab
  const tabContent = _container.querySelector('#tabContent');
  if (_currentTab === 'partB') {
    renderPartBTab(tabContent, dayInfo);
  } else if (_currentTab === 'partA') {
    renderPartATab(tabContent, dayInfo);
  } else if (_currentTab === 'eval') {
    renderEvalTab(tabContent, dayInfo);
  } else if (_currentTab === 'gameTheory') {
    renderGameTheoryTab(tabContent);
  }
}

// ----------------------------------------------------------------------
// TAB 1: PART B STUDIO HUD
// ----------------------------------------------------------------------
function renderPartBTab(container, dayInfo) {
  const questions = dayInfo.partB?.questions || [];
  const activeQ = questions.find((q) => q.slot === _partBSlot) || questions[0];

  const currentElapsed = _proctorTotalSeconds - _proctorRemainingSeconds;
  const currentSlotIndex = Math.min(5, Math.floor(currentElapsed / (24 * 60)) + 1);

  container.innerHTML = `
    <div class="space-y-4">
      <!-- 120-Minute Master Proctor Clock & Audio Gate -->
      <section class="ledger-card p-4 space-y-3">
        <div class="flex items-center justify-between font-mono">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
              120-MINUTE STUDIO PROCTOR
            </span>
            <div class="text-3xl sm:text-4xl font-bold text-[var(--text)] tabular-nums" id="proctorClock">
              ${formatClock(_proctorRemainingSeconds)}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="toggleProctorBtn" class="px-3.5 py-2 rounded-[2px] font-mono text-xs font-bold border transition-colors touch-manipulation ${
              _isProctorRunning
                ? 'bg-[var(--raised)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)]'
                : 'bg-[var(--text)] border-[var(--text)] text-[var(--surface)] hover:opacity-90'
            }">
              ${_isProctorRunning ? 'PAUSE CLOCK' : 'START 120m STUDIO'}
            </button>
            <button id="resetProctorBtn" class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors touch-manipulation" title="Reset proctor timer">
              <span class="w-4 h-4">${icon('timer')}</span>
            </button>
          </div>
        </div>

        <!-- 5-Slot Segmented Progress Ledger -->
        <div class="space-y-1">
          <div class="flex items-center justify-between font-mono text-[10px] text-[var(--muted)]">
            <span>SLOT 1 (Q1)</span>
            <span>SLOT 2 (Q2)</span>
            <span>SLOT 3 (Q3)</span>
            <span>SLOT 4 (Q4)</span>
            <span>SLOT 5 (Q5)</span>
          </div>
          <div class="grid grid-cols-5 gap-1 h-2 bg-[var(--raised)] rounded-[1px] p-0.5 border border-[var(--border)]">
            ${[1, 2, 3, 4, 5].map((s) => {
              const isPast = currentSlotIndex > s;
              const isCurrent = currentSlotIndex === s && _isProctorRunning;
              return `<div class="h-full rounded-[1px] ${
                isPast
                  ? 'bg-[var(--text)]'
                  : isCurrent
                  ? 'bg-[var(--chart-accent)] animate-pulse'
                  : 'bg-[var(--border)]'
              }"></div>`;
            }).join('')}
          </div>
          <p class="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1.5 mt-1">
            <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('volume')}</span>
            Audio relay thud alerts automatically trigger at every 24-minute slot switch.
          </p>
        </div>
      </section>

      <!-- Slot Navigation Buttons -->
      <div class="grid grid-cols-5 gap-1.5 font-mono text-xs">
        ${questions.map((q) => {
          const isSelected = q.slot === _partBSlot;
          return `
            <button data-slot="${q.slot}" class="slot-select-btn py-2 px-1 text-center rounded-[2px] border transition-colors touch-manipulation ${
              isSelected
                ? 'bg-[var(--surface)] border-[var(--chart-accent)] text-[var(--text)] font-bold shadow-sm'
                : 'bg-[var(--raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }">
              <span class="block text-[10px] uppercase">Q.${q.slot}</span>
              <span class="block text-[9px] truncate">${q.shortTitle || `Slot ${q.slot}`}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Question Prompt Card -->
      ${activeQ ? `
        <article class="ledger-card p-5 space-y-4 border-l-4 border-l-[var(--chart-accent)]">
          <div class="flex items-start justify-between gap-3 font-mono">
            <div>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
                QUESTION ${activeQ.slot} · 20 MARKS
              </span>
              <h3 class="text-base font-bold text-[var(--text)] mt-1.5">${activeQ.title}</h3>
            </div>
            <span class="text-xs font-semibold px-2 py-1 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] tabular-nums">
              24 MINS
            </span>
          </div>

          <!-- Prompt Stem / Scenario / Task -->
          <div class="text-sm text-[var(--text)] leading-relaxed whitespace-pre-line bg-[var(--surface)] p-4 rounded-[2px] border border-[var(--border)] font-sans">
            ${activeQ.prompt}
          </div>

          <!-- Official Evaluation Criteria (Checklist for candidate) -->
          ${activeQ.criteria && activeQ.criteria.length > 0 ? `
            <div class="space-y-2 pt-2 border-t border-[var(--rule)]">
              <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
                OFFICIAL IIT BOMBAY EVALUATION CRITERIA (5 MARKS EACH)
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs">
                ${activeQ.criteria.map((c, i) => `
                  <div class="flex items-start gap-2 p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
                    <span class="w-4 h-4 text-[var(--chart-accent)] shrink-0 mt-0.5">${icon('check')}</span>
                    <span class="text-[var(--text)]">${c}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Slot Action Controls -->
          <div class="flex items-center justify-between pt-2 border-t border-[var(--rule)] font-mono text-xs">
            <button id="prevSlotBtn" class="px-3 py-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--text)] ${
              _partBSlot <= 1 ? 'opacity-40 pointer-events-none' : ''
            }">
              ← PREV QUESTION
            </button>
            <span class="text-[var(--muted)]">SLOT ${_partBSlot} OF 5</span>
            <button id="nextSlotBtn" class="px-3 py-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--text)] ${
              _partBSlot >= 5 ? 'opacity-40 pointer-events-none' : ''
            }">
              NEXT QUESTION →
            </button>
          </div>
        </article>
      ` : ''}
    </div>
  `;

  // Bind slot buttons
  container.querySelectorAll('.slot-select-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      _partBSlot = parseInt(btn.dataset.slot, 10);
      drawView();
    });
  });

  const prevBtn = container.querySelector('#prevSlotBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (_partBSlot > 1) {
        _partBSlot--;
        drawView();
      }
    });
  }

  const nextBtn = container.querySelector('#nextSlotBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (_partBSlot < 5) {
        _partBSlot++;
        drawView();
      }
    });
  }

  // Bind Proctor Clock Controls
  const toggleBtn = container.querySelector('#toggleProctorBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (_isProctorRunning) {
        stopProctorClock();
      } else {
        startProctorClock();
      }
      drawView();
    });
  }

  const resetBtn = container.querySelector('#resetProctorBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset the 120-minute Studio Proctor timer back to 02:00:00?')) {
        stopProctorClock();
        _proctorRemainingSeconds = _proctorTotalSeconds;
        _lastSlotNotified = 1;
        drawView();
      }
    });
  }
}

// ----------------------------------------------------------------------
// TAB 2: PART A COGNITIVE SPRINT
// ----------------------------------------------------------------------
function renderPartATab(container, dayInfo) {
  const questions = dayInfo.partAQuestions || [];
  const rules = gameTheoryData;

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Sprint Guidance Header -->
      <section class="ledger-card p-4 space-y-2">
        <div class="flex items-center justify-between font-mono">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--text)]">
            PART A DAILY SLICE · 4 HIGH-YIELD QUESTIONS
          </span>
          <span class="text-xs text-[var(--chart-accent)] font-semibold tabular-nums">
            TARGET: ~4–5 MINS TOTAL
          </span>
        </div>
        <p class="text-xs text-[var(--muted)] leading-relaxed font-sans">
          Physical paper sprint mode: solve on scratch paper following the mathematical expected-value rules below, then verify your answer key.
        </p>
      </section>

      <!-- Questions List -->
      ${questions.map((q, idx) => {
        const rule = rules[q.type] || rules.MCQ;
        const isNAT = q.type === 'NAT';
        const isMSQ = q.type === 'MSQ';
        const isMCQ = q.type === 'MCQ';

        return `
          <article class="ledger-card p-4 space-y-3" id="qCard-${q.id}">
            <!-- Question Code & Type Badge -->
            <div class="flex items-center justify-between gap-2 font-mono flex-wrap">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs px-2 py-0.5 rounded-[2px] bg-[var(--text)] text-[var(--surface)]">
                  ${q.id}
                </span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)]">
                  ${q.type} (${rule.marks})
                </span>
              </div>
              <span class="text-[10px] font-bold text-[var(--chart-accent)] uppercase tracking-wider">
                ${rule.evStrategy}
              </span>
            </div>

            <!-- Game-Theoretic Expected Value Alert Banner -->
            <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-xs font-mono space-y-1">
              <div class="flex items-center gap-1.5 font-bold text-[var(--text)] text-[11px]">
                <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('bulb')}</span>
                <span>GAME THEORY RULE:</span>
              </div>
              <p class="text-[var(--muted)] text-[11px] leading-relaxed font-sans">
                ${rule.rule}
              </p>
            </div>

            <!-- Stem Text -->
            <div class="text-sm text-[var(--text)] leading-relaxed font-sans pt-1">
              ${q.stem}
            </div>

            <!-- Options (for MSQ and MCQ) -->
            ${q.options && Object.keys(q.options).length > 0 ? `
              <div class="space-y-1.5 pt-1 font-sans text-xs">
                ${Object.entries(q.options).map(([optKey, optVal]) => `
                  <div class="flex items-start gap-2.5 p-2 rounded-[2px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">
                    <span class="font-mono font-bold text-[var(--text)] shrink-0 w-5">(${optKey})</span>
                    <span>${optVal}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Solution & Answer Key Reveal Drawer -->
            <div class="pt-2 border-t border-[var(--rule)] flex items-center justify-between font-mono text-xs">
              <button data-qid="${q.id}" class="reveal-key-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--raised)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] font-semibold transition-colors touch-manipulation">
                <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('eye')}</span>
                REVEAL ANSWER KEY
              </button>
              <div id="keyBox-${q.id}" class="hidden font-mono font-bold text-sm px-3 py-1 rounded-[2px] bg-[var(--surface)] border border-[var(--chart-accent)] text-[var(--chart-accent)]">
                KEY: ${q.answer || 'Refer to Compendium'}
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  // Bind reveal buttons
  container.querySelectorAll('.reveal-key-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      const keyBox = container.querySelector(`#keyBox-${qid}`);
      if (keyBox) {
        keyBox.classList.toggle('hidden');
        btn.innerHTML = keyBox.classList.contains('hidden')
          ? `<span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('eye')}</span> REVEAL ANSWER KEY`
          : `<span class="w-3.5 h-3.5 text-[var(--muted)]">${icon('close')}</span> HIDE KEY`;
      }
    });
  });
}

// ----------------------------------------------------------------------
// TAB 3: SELF-EVALUATION & ERROR TAXONOMY (15m)
// ----------------------------------------------------------------------
function renderEvalTab(container, dayInfo) {
  const examLog = getExamLog(_activeDate) || {
    partBScores: { q1: 15, q2: 15, q3: 15, q4: 15, q5: 15 },
    partAScore: 75,
    selectedErrors: [],
    notes: '',
  };

  const taxonomy = gameTheoryData.errorTaxonomy;
  const rubric = gameTheoryData.PART_B_RUBRIC;

  const currentScores = examLog.partBScores || { q1: 15, q2: 15, q3: 15, q4: 15, q5: 15 };
  const totalPartB = Object.values(currentScores).reduce((a, b) => a + Number(b), 0);

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Header -->
      <section class="ledger-card p-4 space-y-2">
        <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
          15-MINUTE POST-EXAM SELF-AUDIT
        </span>
        <h3 class="text-base font-bold text-[var(--text)]">Official IIT Bombay Rubric & Error Taxonomy</h3>
        <p class="text-xs text-[var(--muted)] leading-relaxed">
          Evaluate your physical A4 studio sheets. Top-100 CEED candidates obsess over error classification rather than raw marks.
        </p>
      </section>

      <!-- Part B 100-Mark Score Tally -->
      <section class="ledger-card p-4 space-y-4">
        <div class="flex items-center justify-between font-mono">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            PART B STUDIO MARKS (OUT OF 100)
          </span>
          <span class="text-xl font-black text-[var(--chart-accent)] tabular-nums" id="partBTotalDisplay">
            ${totalPartB} / 100
          </span>
        </div>

        <!-- 5 Questions Sliders -->
        <div class="space-y-3 font-mono text-xs">
          ${[
            { key: 'q1', label: 'Q1: Sketching (POV & Line Hierarchy)', max: 20 },
            { key: 'q2', label: 'Q2: Creativity (Story & Stimulus Twist)', max: 20 },
            { key: 'q3', label: 'Q3: Visual Sensitivity (Icon Language & Craft)', max: 20 },
            { key: 'q4', label: 'Q4: Form Sensitivity & 3D Detailing', max: 20 },
            { key: 'q5', label: 'Q5: Problem ID & Visual Solutions', max: 20 },
          ].map((item) => `
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[var(--text)] font-semibold">${item.label}</span>
                <span class="font-bold text-[var(--text)] tabular-nums" id="scoreVal-${item.key}">
                  ${currentScores[item.key] || 0} / ${item.max}
                </span>
              </div>
              <input type="range" min="0" max="${item.max}" step="1" value="${currentScores[item.key] || 0}"
                data-score-key="${item.key}"
                class="rubric-slider w-full accent-[var(--chart-accent)] cursor-pointer" />
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Error Taxonomy Tag Picker -->
      <section class="ledger-card p-4 space-y-3">
        <div class="flex items-center justify-between font-mono">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            ERROR TAXONOMY AUDIT
          </span>
          <span class="text-[11px] text-[var(--muted)]">TAP TO TAG MISTAKES</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="errorTagsContainer">
          ${taxonomy.map((tag) => {
            const isSelected = (examLog.selectedErrors || []).includes(tag.id);
            return `
              <button data-error-id="${tag.id}" class="error-tag-btn p-2 rounded-[2px] border text-left font-mono text-xs transition-colors touch-manipulation flex items-center justify-between ${
                isSelected
                  ? 'bg-[var(--surface)] border-[var(--negative)] text-[var(--negative)] font-bold'
                  : 'bg-[var(--raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }">
                <span>${tag.label}</span>
                <span class="text-[10px] uppercase text-[var(--muted)] shrink-0 ml-1">(${tag.section})</span>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Reflection & Improvement Notes -->
      <section class="ledger-card p-4 space-y-2">
        <label for="sessionNotes" class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text)] block">
          LESSONS & FIXES FOR TOMORROW'S PAPER
        </label>
        <textarea id="sessionNotes" rows="3"
          placeholder="e.g. Lost 4m in Q1 due to vanishing point tilt; MSQ partial harvest rule worked well; finished Part A in 38 mins..."
          class="w-full p-3 rounded-[2px] bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] font-sans focus:outline-none focus:border-[var(--chart-accent)] leading-relaxed">${examLog.notes || ''}</textarea>
      </section>

      <!-- Commit Session Button -->
      <button id="commitSessionBtn" class="w-full py-3.5 rounded-[2px] bg-[var(--text)] hover:opacity-90 text-[var(--surface)] font-mono text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2">
        <span class="w-4 h-4">${icon('check')}</span>
        COMMIT EXAM AUDIT & COMPLETE DOMINO 3 (+150 XP)
      </button>
    </div>
  `;

  // Bind score sliders
  const sliders = container.querySelectorAll('.rubric-slider');
  sliders.forEach((slider) => {
    slider.addEventListener('input', () => {
      const key = slider.dataset.scoreKey;
      const val = parseInt(slider.value, 10);
      currentScores[key] = val;
      const valDisplay = container.querySelector(`#scoreVal-${key}`);
      if (valDisplay) valDisplay.textContent = `${val} / 20`;

      // Update total
      const newTotal = Object.values(currentScores).reduce((a, b) => a + Number(b), 0);
      const totalDisplay = container.querySelector('#partBTotalDisplay');
      if (totalDisplay) totalDisplay.textContent = `${newTotal} / 100`;
    });
  });

  // Bind error tags
  const selectedErrors = new Set(examLog.selectedErrors || []);
  container.querySelectorAll('.error-tag-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const errId = btn.dataset.errorId;
      if (selectedErrors.has(errId)) {
        selectedErrors.delete(errId);
        btn.classList.remove('bg-[var(--surface)]', 'border-[var(--negative)]', 'text-[var(--negative)]', 'font-bold');
        btn.classList.add('bg-[var(--raised)]', 'border-[var(--border)]', 'text-[var(--muted)]');
      } else {
        selectedErrors.add(errId);
        btn.classList.remove('bg-[var(--raised)]', 'border-[var(--border)]', 'text-[var(--muted)]');
        btn.classList.add('bg-[var(--surface)]', 'border-[var(--negative)]', 'text-[var(--negative)]', 'font-bold');
      }
    });
  });

  // Bind commit button
  container.querySelector('#commitSessionBtn').addEventListener('click', () => {
    const notes = container.querySelector('#sessionNotes').value;
    const finalTotal = Object.values(currentScores).reduce((a, b) => a + Number(b), 0);

    saveExamSession(_activeDate, {
      partBScores: currentScores,
      partBTotal: finalTotal,
      selectedErrors: Array.from(selectedErrors),
      notes,
    });

    // Auto-complete Domino 3
    const day = ensureDayRecord(_activeDate);
    if (!day.completed['d3']) {
      toggleDomino('d3', _activeDate);
    }

    playDing();
    vibrateCompletion();
    showToast(`Session Committed! Part B: ${finalTotal}/100 Marks. Domino 3 Complete!`, 'success');

    setTimeout(() => {
      if (_onBack) _onBack();
    }, 1200);
  });
}

// ----------------------------------------------------------------------
// TAB 4: GAME THEORY BLUEPRINT
// ----------------------------------------------------------------------
function renderGameTheoryTab(container) {
  const gt = gameTheoryData;

  container.innerHTML = `
    <div class="space-y-4 font-sans text-xs">
      <article class="ledger-card p-5 space-y-3">
        <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--chart-accent)] block">
          MATHEMATICAL BLUEPRINT: 2024–2026 MARKING EQUILIBRIUM
        </span>
        <h3 class="text-base font-bold text-[var(--text)] font-mono">
          Game-Theoretic Implications of Scoring Rules
        </h3>
        <p class="text-[var(--muted)] leading-relaxed">
          CEED Part A is a game of probability and expected value (EV), not rapid guessing. The 2024–2026 structural regime introduced two pivotal mathematical asymmetries:
        </p>

        <div class="space-y-3 pt-2 font-mono">
          <!-- MSQ Proof -->
          <div class="p-3 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] space-y-1.5">
            <h4 class="font-bold text-[var(--text)] text-xs">1. MSQ Partial Harvesting Theorem</h4>
            <p class="text-[var(--muted)] text-[11px] font-sans leading-relaxed">
              If a question has 3 correct options (A, B, D) and you are 100% certain of A and B but uncertain of D:
            </p>
            <div class="p-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px]">
              Guaranteed harvest (A + B only): <strong>+2.0 Marks (0 penalty risk)</strong><br />
              Speculating on D (at 50% subjective prob): 0.5(+4) + 0.5(−1) = <strong>+1.5 Marks</strong>
            </div>
            <p class="text-[var(--negative)] font-bold text-[11px]">
              RULE: Speculating on a 50/50 option LOSES expected value. Never guess a third option unless certainty &gt; 67%!
            </p>
          </div>

          <!-- MCQ Proof -->
          <div class="p-3 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] space-y-1.5">
            <h4 class="font-bold text-[var(--text)] text-xs">2. MCQ 2-Option Distractor Elimination</h4>
            <p class="text-[var(--muted)] text-[11px] font-sans leading-relaxed">
              In Section III (MCQ), correct is +3.0 and incorrect is −0.5. The penalty ratio is <strong>1:6</strong>.
            </p>
            <div class="p-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px]">
              Eliminate 1 distractor (3 left): (1/3)(+3) + (2/3)(−0.5) = <strong>+0.67 EV</strong><br />
              Eliminate 2 distractors (50/50): (1/2)(+3) + (1/2)(−0.5) = <strong>+1.25 EV</strong>
            </div>
            <p class="text-[var(--chart-accent)] font-bold text-[11px]">
              RULE: Aggressively eliminate 2 implausible choices and ALWAYS commit. The odds heavily favour you.
            </p>
          </div>
        </div>
      </article>

      <!-- Studio Slot Protocol Breakdown -->
      <article class="ledger-card p-5 space-y-3 font-mono">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block">
          PART B 120-MINUTE TIME WINDOW PROTOCOL
        </span>
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span>00:00–24:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q1 Sketching (POV, Proportion, Tone)</span>
            <span class="text-[var(--muted)]">20 Marks</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span>24:00–48:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q2 Creativity (4-Frame Story & Symbol)</span>
            <span class="text-[var(--muted)]">20 Marks</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span>48:00–72:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q3 Visual Sensitivity (4 B&W Icons)</span>
            <span class="text-[var(--muted)]">20 Marks</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span>72:00–96:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q4 Form Sensitivity (3D Product Hero)</span>
            <span class="text-[var(--muted)]">20 Marks</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span>96:00–120:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q5 Problem ID (HMW Lists + Solutions)</span>
            <span class="text-[var(--muted)]">20 Marks</span>
          </div>
        </div>
      </article>
    </div>
  `;
}

// ----------------------------------------------------------------------
// PROCTOR TIMER ENGINE
// ----------------------------------------------------------------------
function startProctorClock() {
  if (_proctorInterval) clearInterval(_proctorInterval);
  _isProctorRunning = true;

  _proctorInterval = setInterval(() => {
    if (_proctorRemainingSeconds > 0) {
      _proctorRemainingSeconds--;

      // Check for 24-minute slot transitions: 96m left, 72m left, 48m left, 24m left, 0m left
      const elapsed = _proctorTotalSeconds - _proctorRemainingSeconds;
      const currentSlot = Math.min(5, Math.floor(elapsed / (24 * 60)) + 1);

      if (currentSlot !== _lastSlotNotified && elapsed % (24 * 60) === 0) {
        _lastSlotNotified = currentSlot;
        _partBSlot = currentSlot;
        playDing();
        vibrateCompletion();
        showNotification(`Slot ${currentSlot} Started!`, {
          body: `Switch to Question ${currentSlot} now. 24 minutes on clock.`,
        });
        showToast(`🔔 Slot ${currentSlot} Started! Switch questions now.`, 'warning');
        drawView();
      }

      // Update timer display without full re-render
      const clockEl = document.querySelector('#proctorClock');
      if (clockEl) {
        clockEl.textContent = formatClock(_proctorRemainingSeconds);
      }
    } else {
      stopProctorClock();
      playDing();
      vibrateCompletion();
      showNotification('120-Minute Studio Session Finished!', {
        body: 'Time to evaluate your sheets and log error tags.',
      });
      showToast('120-Minute Studio Time Expired! Proceed to Evaluation.', 'info');
      _currentTab = 'eval';
      drawView();
    }
  }, 1000);
}

function stopProctorClock() {
  if (_proctorInterval) {
    clearInterval(_proctorInterval);
    _proctorInterval = null;
  }
  _isProctorRunning = false;
}

function formatClock(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
