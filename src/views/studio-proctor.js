/**
 * Studio Proctor HUD — CEED 2027 Part B Studio Exam Terminal.
 * Features:
 * 1. 120-Minute Master Proctor Timer with automated 24-minute slot transitions & audio cues
 * 2. 5 Mandatory Studio Prompts (Q1-Q5, 20m each) with official evaluation criteria checklists
 * 3. Game Theory Reference Drawer (Marking Scheme & Time Split Analysis)
 * 4. Direct session completion and momentum logging
 */
import partBData from '../data/part_b_questions.json';
import { ensureDayRecord } from '../core/state.js';
import { toggleDomino } from '../core/streak.js';
import { getDayIndex, getPhaseLabel, getCurrentDateStr } from '../utils/dates.js';
import { icon } from '../icons/index.js';
import { playDing } from '../utils/sound.js';
import { vibrateTap, vibrateCompletion, showNotification } from '../core/notifications.js';
import { showToast } from '../components/header.js';

let _activeDate = null;
let _currentTab = 'partB'; // 'partB' | 'gameTheory'
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
  const partB = partBData.find((p) => p.day === dayNumber) || partBData[0];

  return {
    dayIndex,
    dayNumber,
    dateStr,
    phase: getPhaseLabel(dayIndex),
    partB,
  };
}

function drawView() {
  const dayInfo = getDayInfo(_activeDate);
  const day = ensureDayRecord(_activeDate);
  const isD3Done = !!day.completed['d3'];

  _container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28 font-sans">
      <!-- Top Navigation Bar -->
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
      <nav class="flex border-b border-[var(--border)] font-mono text-xs gap-1" role="tablist">
        <button data-tab="partB" class="proctor-tab py-2.5 px-3.5 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'partB'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          PART B: 120m STUDIO HUD
        </button>
        <button data-tab="gameTheory" class="proctor-tab py-2.5 px-3.5 font-semibold border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
          _currentTab === 'gameTheory'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          GAME THEORY BLUEPRINT
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
    renderPartBTab(tabContent, dayInfo, isD3Done);
  } else if (_currentTab === 'gameTheory') {
    renderGameTheoryTab(tabContent);
  }
}

// ----------------------------------------------------------------------
// TAB 1: PART B STUDIO HUD
// ----------------------------------------------------------------------
function renderPartBTab(container, dayInfo, isD3Done) {
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
            <button id="toggleProctorBtn" class="px-3.5 py-2 rounded-[2px] font-mono text-xs font-bold border transition-colors touch-manipulation active:scale-95 ${
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
            Tactile relay thud sound alert triggers automatically at every 24-minute slot switch.
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
                ${activeQ.criteria.map((c) => `
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

      <!-- Complete Session Action Button -->
      <button id="completeStudioBtn" class="w-full py-3.5 rounded-[2px] bg-[var(--text)] hover:opacity-90 text-[var(--surface)] font-mono text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2">
        <span class="w-4 h-4">${icon('check')}</span>
        ${isD3Done ? 'DOMINO 3 COMPLETED' : 'COMPLETE 120m STUDIO SESSION'}
      </button>
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

  // Bind Complete Session Button
  const completeBtn = container.querySelector('#completeStudioBtn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      stopProctorClock();
      const day = ensureDayRecord(_activeDate);
      if (!day.completed['d3']) {
        toggleDomino('d3', _activeDate);
      }
      playDing();
      vibrateCompletion();
      showToast('Domino 3 (Part B Studio) Completed!', 'success');
      setTimeout(() => {
        if (_onBack) _onBack();
      }, 500);
    });
  }
}

// ----------------------------------------------------------------------
// TAB 2: GAME THEORY BLUEPRINT
// ----------------------------------------------------------------------
function renderGameTheoryTab(container) {
  container.innerHTML = `
    <div class="space-y-4 font-sans text-xs">
      <article class="ledger-card p-5 space-y-3">
        <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--chart-accent)] block">
          MATHEMATICAL BLUEPRINT: CEED STUDIO PROTOCOL
        </span>
        <h3 class="text-base font-bold text-[var(--text)] font-mono">
          Strict 24-Minute × 5 Question Execution Discipline
        </h3>
        <p class="text-[var(--muted)] leading-relaxed">
          The official IIT Bombay Part B examination allocates exactly 100 marks across 5 mandatory questions. To maximize score yield, time discipline must be strictly enforced:
        </p>

        <div class="space-y-2 pt-2 font-mono">
          <div class="flex items-center justify-between p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">00:00–24:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q1: Sketching (POV, Proportion, Tone)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">24:00–48:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q2: Creativity (4-Frame Story & Symbol)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">48:00–72:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q3: Visual Sensitivity (4 B&W Icons)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">72:00–96:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q4: Form Sensitivity (3D Product Hero)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">96:00–120:00 (24m)</span>
            <span class="font-bold text-[var(--text)]">Q5: Problem ID (HMW Lists + Solutions)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
        </div>
      </article>

      <article class="ledger-card p-5 space-y-3 font-mono">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block">
          IIT BOMBAY EVALUATION CRITERIA CORE MATRIX
        </span>
        <div class="space-y-2 text-xs">
          <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block mb-1">Q1 Sketching:</strong>
            <span class="text-[var(--muted)] text-[11px] font-sans">POV adherence (5m) · Anatomical proportions (5m) · Line-weight hierarchy (5m) · Context & directional light (5m)</span>
          </div>
          <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block mb-1">Q2 Creativity:</strong>
            <span class="text-[var(--muted)] text-[11px] font-sans">Statistical originality (5m) · Organic stimulus integration (5m) · Visual storytelling twist (5m) · Craft & witty titling (5m)</span>
          </div>
          <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block mb-1">Q3 Visual Sensitivity:</strong>
            <span class="text-[var(--muted)] text-[11px] font-sans">Systemic consistency (5m) · Semantic legibility without text (5m) · Figure-ground equilibrium (5m) · Edge precision (5m)</span>
          </div>
          <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block mb-1">Q4 Form Sensitivity:</strong>
            <span class="text-[var(--muted)] text-[11px] font-sans">Form DNA retention (5m) · Form-function synthesis (5m) · Volumetric 3D shading (5m) · Parting lines & materials (5m)</span>
          </div>
          <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block mb-1">Q5 Problem ID:</strong>
            <span class="text-[var(--muted)] text-[11px] font-sans">Depth & empathy (5m) · Analytical HMW framing (5m) · Solution ingenuity (5m) · Visual explanatory callouts (5m)</span>
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
        body: 'Studio time complete. Great work.',
      });
      showToast('120-Minute Studio Time Expired!', 'info');
      const day = ensureDayRecord(_activeDate);
      if (!day.completed['d3']) {
        toggleDomino('d3', _activeDate);
      }
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
