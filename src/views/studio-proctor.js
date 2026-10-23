/**
 * Studio Proctor HUD — CEED 2027 Part B Studio Exam Terminal.
 * Optimized for iPhone 12 & Mobile:
 * 1. Sticky Focus HUD: 120m Proctor Timer & Segmented Q1-Q5 Pills
 * 2. 5 Mandatory Studio Prompts with IIT Bombay evaluation criteria checklists
 * 3. Game Theory Reference Guide & Scoring Matrix
 * 4. Automated 24-minute slot transitions with synthesized audio and haptic feedback
 */
import partBData from '../data/part_b_questions.json';
import { ensureDayRecord, setDominoDuration } from '../core/state.js';
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
    <div class="max-w-xl mx-auto px-3 pt-2 space-y-2.5 pb-28 font-sans">
      <!-- Top Navigation Bar -->
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2 font-mono text-xs">
        <button id="proctorBackBtn" class="inline-flex items-center gap-1 font-bold text-[var(--chart-accent)] hover:opacity-80 touch-manipulation">
          <span class="w-3.5 h-3.5">${icon('arrowLeft')}</span>
          DASHBOARD
        </button>

        <div class="flex items-center gap-1.5">
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
            DAY ${dayInfo.dayNumber} OF 87
          </span>
          <span class="text-[10px] text-[var(--muted)] hidden sm:inline">${dayInfo.phase}</span>
        </div>
      </div>

      <!-- Mode Selector Tabs (Compact for iPhone 12) -->
      <nav class="flex border-b border-[var(--rule)] font-mono text-xs" role="tablist">
        <button data-tab="partB" class="proctor-tab flex-1 py-2 px-2 text-center font-bold border-b-2 transition-colors touch-manipulation ${
          _currentTab === 'partB'
            ? 'border-[var(--chart-accent)] text-[var(--text)] bg-[var(--raised)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
        }">
          STUDIO HUD
        </button>
        <button data-tab="gameTheory" class="proctor-tab flex-1 py-2 px-2 text-center font-bold border-b-2 transition-colors touch-manipulation ${
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
    renderPartBTab(tabContent, dayInfo, isD3Done);
  } else if (_currentTab === 'gameTheory') {
    renderGameTheoryTab(tabContent);
  }
}

// ----------------------------------------------------------------------
// TAB 1: PART B STUDIO HUD (FOCUS MODE)
// ----------------------------------------------------------------------
function renderPartBTab(container, dayInfo, isD3Done) {
  const questions = dayInfo.partB?.questions || [];
  const activeQ = questions.find((q) => q.slot === _partBSlot) || questions[0];

  const currentElapsed = _proctorTotalSeconds - _proctorRemainingSeconds;
  const currentSlotIndex = Math.min(5, Math.floor(currentElapsed / (24 * 60)) + 1);

  container.innerHTML = `
    <div class="space-y-2.5">
      <!-- Sticky Focus HUD: Proctor Clock & Slot Selector -->
      <div class="sticky top-0 z-20 bg-[var(--ground)] pt-1 pb-2 space-y-2">
        <!-- 120-Minute Master Proctor Clock Card -->
        <section class="ledger-card p-3 font-mono shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                120-MINUTE PROCTOR
              </span>
              <div class="text-2xl sm:text-3xl font-black text-[var(--text)] tabular-nums tracking-wide" id="proctorClock">
                ${formatClock(_proctorRemainingSeconds)}
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button id="toggleProctorBtn" class="px-3 py-1.5 rounded-[2px] font-mono text-xs font-bold border transition-colors touch-manipulation active:scale-95 ${
                _isProctorRunning
                  ? 'bg-[var(--raised)] border-[var(--border)] text-[var(--text)]'
                  : 'bg-[var(--text)] border-[var(--text)] text-[var(--surface)]'
              }">
                ${_isProctorRunning ? 'PAUSE' : 'START 120m'}
              </button>
              <button id="resetProctorBtn" class="p-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors touch-manipulation active:scale-95" title="Reset proctor timer">
                <span class="w-4 h-4">${icon('timer')}</span>
              </button>
            </div>
          </div>

          <!-- 5-Slot Segmented Progress Rail -->
          <div class="grid grid-cols-5 gap-1 h-1.5 bg-[var(--raised)] rounded-[1px] p-0.5 border border-[var(--border)] mt-2">
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
        </section>

        <!-- Segmented Question Pills (Q1 to Q5) -->
        <div class="grid grid-cols-5 gap-1 font-mono text-xs">
          ${questions.map((q) => {
            const isSelected = q.slot === _partBSlot;
            const isCurrentSlot = currentSlotIndex === q.slot && _isProctorRunning;
            return `
              <button data-slot="${q.slot}" class="slot-select-btn py-1.5 px-0.5 text-center rounded-[2px] border transition-all touch-manipulation active:scale-95 ${
                isSelected
                  ? 'bg-[var(--text)] border-[var(--text)] text-[var(--surface)] font-bold shadow-sm'
                  : isCurrentSlot
                  ? 'bg-[var(--surface)] border-[var(--chart-accent)] text-[var(--chart-accent)] font-bold'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }">
                <span class="block text-[11px] font-bold">Q${q.slot}</span>
                <span class="block text-[8px] opacity-75 uppercase tracking-tighter">24m</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Active Question Prompt Card -->
      ${activeQ ? `
        <article class="ledger-card p-3.5 space-y-3 border-l-4 border-l-[var(--chart-accent)]">
          <!-- Header -->
          <div class="flex items-start justify-between gap-2 font-mono">
            <div>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--text)] uppercase tracking-wider">
                QUESTION ${activeQ.slot} · 20 MARKS
              </span>
              <h3 class="text-sm font-bold text-[var(--text)] mt-1.5 leading-snug">${activeQ.title}</h3>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] tabular-nums shrink-0">
              24 MINS
            </span>
          </div>

          <!-- Prompt Stem / Scenario / Task -->
          <div class="text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-line bg-[var(--raised)] p-3 rounded-[2px] border border-[var(--border)] font-sans select-text">
            ${activeQ.prompt}
          </div>

          <!-- Official Evaluation Criteria (Checklist for candidate) -->
          ${activeQ.criteria && activeQ.criteria.length > 0 ? `
            <div class="space-y-1.5 pt-2 border-t border-[var(--rule)]">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
                IIT BOMBAY EVALUATION CRITERIA (5 MARKS EACH)
              </span>
              <div class="space-y-1.5 font-sans text-xs">
                ${activeQ.criteria.map((c) => `
                  <div class="flex items-start gap-2 p-2 rounded-[2px] bg-[var(--surface)] border border-[var(--border)]">
                    <span class="w-3.5 h-3.5 text-[var(--chart-accent)] shrink-0 mt-0.5">${icon('check')}</span>
                    <span class="text-[var(--text)] text-[11px] leading-relaxed">${c}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Touch-friendly Prev / Next Slot Controls -->
          <div class="flex items-center justify-between pt-2 border-t border-[var(--rule)] font-mono text-xs">
            <button id="prevSlotBtn" class="px-2.5 py-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--raised)] active:scale-95 transition-all text-[11px] font-bold ${
              _partBSlot <= 1 ? 'opacity-30 pointer-events-none' : ''
            }">
              ← PREV Q
            </button>
            <span class="text-[10px] font-bold text-[var(--muted)]">SLOT ${_partBSlot} OF 5</span>
            <button id="nextSlotBtn" class="px-2.5 py-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--raised)] active:scale-95 transition-all text-[11px] font-bold ${
              _partBSlot >= 5 ? 'opacity-30 pointer-events-none' : ''
            }">
              NEXT Q →
            </button>
          </div>
        </article>
      ` : ''}

      <!-- Complete Session Action Button -->
      <button id="completeStudioBtn" class="w-full py-3 rounded-[2px] bg-[var(--text)] hover:opacity-90 text-[var(--surface)] font-mono text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2">
        <span class="w-4 h-4">${icon('check')}</span>
        ${isD3Done ? 'DOMINO 3 COMPLETED' : 'COMPLETE 120m STUDIO SESSION'}
      </button>
    </div>
  `;

  // Bind slot buttons
  container.querySelectorAll('.slot-select-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      vibrateTap();
      _partBSlot = parseInt(btn.dataset.slot, 10);
      drawView();
    });
  });

  const prevBtn = container.querySelector('#prevSlotBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (_partBSlot > 1) {
        vibrateTap();
        _partBSlot--;
        drawView();
      }
    });
  }

  const nextBtn = container.querySelector('#nextSlotBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (_partBSlot < 5) {
        vibrateTap();
        _partBSlot++;
        drawView();
      }
    });
  }

  // Bind Proctor Clock Controls
  const toggleBtn = container.querySelector('#toggleProctorBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      vibrateTap();
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
      const elapsedMins = Math.max(1, Math.round((_proctorTotalSeconds - _proctorRemainingSeconds) / 60));
      const loggedMins = elapsedMins >= 10 ? elapsedMins : 120;
      setDominoDuration('d3', _activeDate, loggedMins);
      playDing();
      vibrateCompletion();
      showToast(`Domino 3 Completed! (${loggedMins}m logged)`, 'success');
      setTimeout(() => {
        if (_onBack) _onBack();
      }, 500);
    });
  }
}

// ----------------------------------------------------------------------
// TAB 2: GAME THEORY BLUEPRINT (COMPACT FOR MOBILE)
// ----------------------------------------------------------------------
function renderGameTheoryTab(container) {
  container.innerHTML = `
    <div class="space-y-3 font-sans text-xs">
      <article class="ledger-card p-3.5 space-y-2.5">
        <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--chart-accent)] block">
          MATHEMATICAL BLUEPRINT: 24m × 5 QUESTIONS
        </span>
        <h3 class="text-sm font-bold text-[var(--text)] font-mono">
          Strict 24-Minute Execution Protocol
        </h3>
        <p class="text-[var(--muted)] leading-relaxed">
          Part B carries 100 marks across 5 questions. Enforce strict 24-minute boundaries:
        </p>

        <div class="space-y-1.5 pt-1 font-mono text-[11px]">
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">00–24m</span>
            <span class="font-bold text-[var(--text)]">Q1: Sketching (POV, Tone)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">24–48m</span>
            <span class="font-bold text-[var(--text)]">Q2: Creativity (4-Frames)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">48–72m</span>
            <span class="font-bold text-[var(--text)]">Q3: Visual Icons (4 B&W)</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">72–96m</span>
            <span class="font-bold text-[var(--text)]">Q4: Form 3D Product</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <span class="text-[var(--muted)]">96–120m</span>
            <span class="font-bold text-[var(--text)]">Q5: Problem ID & Solutions</span>
            <span class="text-[var(--chart-accent)] font-bold">20m</span>
          </div>
        </div>
      </article>

      <article class="ledger-card p-3.5 space-y-2 font-mono">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
          IIT BOMBAY EVALUATION CRITERIA MATRIX
        </span>
        <div class="space-y-1.5 text-xs">
          <div class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block text-[11px] mb-0.5">Q1 Sketching (20m):</strong>
            <span class="text-[var(--muted)] text-[10px] font-sans">POV adherence (5m) · Proportions (5m) · Line-weight (5m) · Lighting (5m)</span>
          </div>
          <div class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block text-[11px] mb-0.5">Q2 Creativity (20m):</strong>
            <span class="text-[var(--muted)] text-[10px] font-sans">Originality (5m) · Stimulus twist (5m) · Narrative punch (5m) · Witty title (5m)</span>
          </div>
          <div class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block text-[11px] mb-0.5">Q3 Visual Sensitivity (20m):</strong>
            <span class="text-[var(--muted)] text-[10px] font-sans">System consistency (5m) · Semantic legibility (5m) · Figure-ground (5m) · Edges (5m)</span>
          </div>
          <div class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block text-[11px] mb-0.5">Q4 Form Sensitivity (20m):</strong>
            <span class="text-[var(--muted)] text-[10px] font-sans">Form DNA (5m) · Function synthesis (5m) · 3D shading (5m) · Parting lines (5m)</span>
          </div>
          <div class="p-2 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <strong class="text-[var(--text)] block text-[11px] mb-0.5">Q5 Problem ID (20m):</strong>
            <span class="text-[var(--muted)] text-[10px] font-sans">Depth & empathy (5m) · HMW framing (5m) · Ingenuity (5m) · Visual callouts (5m)</span>
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
      setDominoDuration('d3', _activeDate, 120);
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
