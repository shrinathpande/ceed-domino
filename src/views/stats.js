/**
 * Stats View — Strava-Style Athletic Focus Telemetry & Performance Ledger.
 * High-precision metrics: Personal Records (PRs), Per-Domino Splits, Rolling Pacing,
 * 500-Hour Mastery Forecast, and the GitHub Green Contribution Matrix.
 */
import { getTelemetryStats } from '../core/telemetry.js';
import { renderHeatmap } from './heatmap.js';
import { icon } from '../icons/index.js';
import { formatMins } from '../utils/format.js';
import { getCurrentDateStr } from '../utils/dates.js';

export function renderStats(container, onBack, onDateSelect) {
  const stats = getTelemetryStats();
  const currentDateStr = getCurrentDateStr();

  const section = document.createElement('div');
  section.className = 'max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 font-mono';

  // Mastery percentage towards 500h
  const masteryTarget = 500;
  const masteryPercent = Math.min(100, Math.round((stats.totalHours / masteryTarget) * 100));

  section.innerHTML = `
    <!-- Top Navigation Header -->
    <div class="flex items-center justify-between border-b border-[var(--rule)] pb-3">
      <button id="statsBackBtn" class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text)] hover:opacity-80 transition-opacity touch-manipulation" aria-label="Return to console">
        <span class="w-4 h-4">${icon('arrowLeft')}</span>
        DASHBOARD
      </button>
      <span class="text-xs text-[var(--muted)] uppercase tracking-wider">ATHLETIC TELEMETRY</span>
    </div>

    <!-- Page Title -->
    <div>
      <h1 class="text-xl font-bold text-[var(--text)] uppercase tracking-wider">Performance Telemetry</h1>
      <p class="text-xs text-[var(--muted)] mt-0.5 font-sans">Athletic focus volume, discipline splits, pace forecasts, and PRs.</p>
    </div>

    <!-- Section 1: Strava Big Numbers Dashboard -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- Total Volume -->
      <div class="ledger-card p-3 border-l-4 border-l-[var(--text)]">
        <span class="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">LIFETIME VOLUME</span>
        <div class="text-2xl font-black text-[var(--text)] tabular-nums mt-1">${stats.totalHours}<span class="text-xs font-semibold text-[var(--muted)] ml-0.5">hrs</span></div>
        <div class="text-[10px] text-[var(--muted)] font-sans mt-0.5">${stats.totalCompletedDominos} mandatory tasks done</div>
      </div>

      <!-- Daily Pace -->
      <div class="ledger-card p-3 border-l-4 border-l-[var(--chart-accent)]">
        <span class="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">DAILY AVG PACE</span>
        <div class="text-2xl font-black text-[var(--text)] tabular-nums mt-1">${stats.dailyAverageHours}<span class="text-xs font-semibold text-[var(--muted)] ml-0.5">h/day</span></div>
        <div class="text-[10px] text-[var(--muted)] font-sans mt-0.5">${stats.activeDaysCount} active days logged</div>
      </div>

      <!-- Current Streak & Max -->
      <div class="ledger-card p-3 border-l-4 border-l-emerald-600">
        <span class="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">CURRENT STREAK</span>
        <div class="text-2xl font-black text-[var(--text)] tabular-nums mt-1">${stats.currentStreak}<span class="text-xs font-semibold text-[var(--muted)] ml-0.5">days</span></div>
        <div class="text-[10px] text-[var(--muted)] font-sans mt-0.5">All-time record: ${stats.longestStreak} days</div>
      </div>

      <!-- Projected Total Hours -->
      <div class="ledger-card p-3 border-l-4 border-l-amber-600">
        <span class="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">EXAM DAY FORECAST</span>
        <div class="text-2xl font-black text-[var(--text)] tabular-nums mt-1">~${stats.pacing.projectedTotalHours}<span class="text-xs font-semibold text-[var(--muted)] ml-0.5">hrs</span></div>
        <div class="text-[10px] text-[var(--muted)] font-sans mt-0.5">Target: 500 hrs (${masteryPercent}%)</div>
      </div>
    </div>

    <!-- Section 2: Personal Records (PRs) Board -->
    <section class="ledger-card p-4" aria-label="Personal records">
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2 mb-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 text-amber-500">${icon('award')}</span>
          PERSONAL RECORDS (PRs)
        </h2>
        <span class="text-[10px] text-[var(--muted)]">ALL-TIME BESTS</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- PR 1: Longest Day -->
        <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
          <span class="text-[10px] text-[var(--muted)] font-bold block uppercase">LONGEST SINGLE DAY</span>
          <div class="text-base font-bold text-[var(--text)] tabular-nums mt-0.5">
            ${stats.personalRecords.longestDay.hours > 0 ? `${stats.personalRecords.longestDay.hours} hrs` : '—'}
          </div>
          <span class="text-[9px] text-[var(--muted)] block font-sans truncate">
            ${stats.personalRecords.longestDay.dateStr || 'No sessions yet'}
          </span>
        </div>

        <!-- PR 2: Longest Streak -->
        <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
          <span class="text-[10px] text-[var(--muted)] font-bold block uppercase">MAX STREAK RUN</span>
          <div class="text-base font-bold text-[var(--text)] tabular-nums mt-0.5">
            ${stats.personalRecords.longestStreak} Consecutive Days
          </div>
          <span class="text-[9px] text-[var(--muted)] block font-sans">
            ${stats.personalRecords.longestStreak >= 7 ? 'Shield Tier Master' : 'In training'}
          </span>
        </div>

        <!-- PR 3: Peak Week -->
        <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
          <span class="text-[10px] text-[var(--muted)] font-bold block uppercase">PEAK WEEK VOLUME</span>
          <div class="text-base font-bold text-[var(--text)] tabular-nums mt-0.5">
            ${stats.personalRecords.peakWeek.hours > 0 ? `${stats.personalRecords.peakWeek.hours} hrs` : '—'}
          </div>
          <span class="text-[9px] text-[var(--muted)] block font-sans">
            ${stats.personalRecords.peakWeek.weekIndex > 0 ? `Week ${stats.personalRecords.peakWeek.weekIndex} Record` : 'In progress'}
          </span>
        </div>

        <!-- PR 4: Part B Questions Solved -->
        <div class="p-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
          <span class="text-[10px] text-[var(--muted)] font-bold block uppercase">PART B PROMPTS SOLVED</span>
          <div class="text-base font-bold text-[var(--text)] tabular-nums mt-0.5">
            ${stats.personalRecords.totalPartBQuestions} Questions
          </div>
          <span class="text-[9px] text-[var(--muted)] block font-sans">
            D3 Studio Papers Solved
          </span>
        </div>
      </div>
    </section>

    <!-- Section 3: Pacing Engine & 500-Hour Exam Goal -->
    <section class="ledger-card p-4" aria-label="Exam pacing and forecast">
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2 mb-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 text-[var(--chart-accent)]">${icon('timer')}</span>
          500-HOUR MASTERY PACING
        </h2>
        <span class="text-[10px] text-[var(--muted)]">${stats.pacing.daysRemaining} DAYS REMAINING</span>
      </div>

      <!-- Mastery Progress Bar -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-bold text-[var(--text)]">${stats.totalHours} / 500 hrs</span>
          <span class="font-bold text-[var(--chart-accent)]">${masteryPercent}%</span>
        </div>
        <div class="w-full h-2.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] overflow-hidden">
          <div class="h-full bg-[var(--text)] transition-all duration-500" style="width: ${masteryPercent}%"></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="p-2 rounded-[2px] bg-[var(--raised)]">
          <span class="text-[9px] text-[var(--muted)] uppercase block">7-DAY PACE</span>
          <span class="font-bold text-[var(--text)] text-sm tabular-nums mt-0.5 block">${stats.pacing.rollingDailyHours}h</span>
          <span class="text-[8px] text-[var(--muted)]">per day</span>
        </div>
        <div class="p-2 rounded-[2px] bg-[var(--raised)]">
          <span class="text-[9px] text-[var(--muted)] uppercase block">REQUIRED PACE</span>
          <span class="font-bold text-[var(--text)] text-sm tabular-nums mt-0.5 block">${stats.pacing.hoursNeededFor500}h</span>
          <span class="text-[8px] text-[var(--muted)]">per day for 500h</span>
        </div>
        <div class="p-2 rounded-[2px] bg-[var(--raised)]">
          <span class="text-[9px] text-[var(--muted)] uppercase block">PROJECTED FINISH</span>
          <span class="font-bold text-[var(--text)] text-sm tabular-nums mt-0.5 block">~${stats.pacing.projectedTotalHours}h</span>
          <span class="text-[8px] text-[var(--muted)]">by Jan 17, 2027</span>
        </div>
      </div>
    </section>

    <!-- Section 4: Discipline Splits (Per-Domino Breakdown) -->
    <section class="ledger-card p-4" aria-label="Discipline splits">
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2 mb-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 text-emerald-500">${icon('activity')}</span>
          DISCIPLINE SPLITS & DOMINO BREAKDOWN
        </h2>
        <span class="text-[10px] text-[var(--muted)]">ATHLETIC LOG</span>
      </div>

      <div class="space-y-2.5">
        ${stats.dominoSplits
          .map((d) => `
          <div class="p-3 rounded-[2px] bg-[var(--raised)] border border-[var(--border)]">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold px-1 py-0.5 rounded-[1px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">${d.badge}</span>
                <span class="text-xs font-bold text-[var(--text)]">${d.title}</span>
              </div>
              <span class="text-xs font-bold text-[var(--text)] tabular-nums">Σ ${d.totalHours} hrs</span>
            </div>

            <!-- Discipline Metric Bar -->
            <div class="w-full h-1.5 rounded-[1px] bg-[var(--surface)] overflow-hidden mb-2">
              <div class="h-full bg-[var(--chart-accent)]" style="width: ${d.completionRate}%"></div>
            </div>

            <div class="grid grid-cols-3 gap-1 text-[10px] text-[var(--muted)]">
              <div>
                <span class="block">SESSIONS</span>
                <span class="font-bold text-[var(--text)] text-xs tabular-nums">${d.completedCount} (${d.completionRate}%)</span>
              </div>
              <div>
                <span class="block">AVG DURATION</span>
                <span class="font-bold text-[var(--text)] text-xs tabular-nums">${formatMins(d.averageMinutes)}</span>
              </div>
              <div>
                <span class="block">${d.estimatedDistanceKm ? 'EST. DISTANCE' : d.questionsSolved ? 'QUESTIONS' : 'MAX SESSION'}</span>
                <span class="font-bold text-[var(--text)] text-xs tabular-nums">
                  ${
                    d.estimatedDistanceKm
                      ? `${d.estimatedDistanceKm} km`
                      : d.questionsSolved
                      ? `${d.questionsSolved} Part B`
                      : formatMins(d.maxSessionMinutes)
                  }
                </span>
              </div>
            </div>
          </div>
        `)
          .join('')}
      </div>
    </section>

    <!-- Section 5: Floor Adherence Rate -->
    <section class="ledger-card p-4" aria-label="Floor adherence distribution">
      <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2 mb-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">FLOOR ADHERENCE & DISCIPLINE</h2>
        <span class="text-[10px] text-[var(--muted)]">${stats.adherence.totalTrackedDays} ACTIVE DAYS</span>
      </div>

      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-1.5 text-[var(--text)]">
            <span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--text)]"></span>
            Standard Full Floor
          </span>
          <span class="font-bold tabular-nums">${stats.adherence.standardFloorDays} days</span>
        </div>

        <div class="flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-1.5 text-[var(--warning)]">
            <span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--warning)]"></span>
            Emergency Bad-Day Floor
          </span>
          <span class="font-bold tabular-nums">${stats.adherence.emergencyDays} days</span>
        </div>

        <div class="flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-1.5 text-[var(--chart-accent)]">
            <span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--chart-accent)]"></span>
            Streak Shield Applied
          </span>
          <span class="font-bold tabular-nums">${stats.adherence.shieldDays} days</span>
        </div>

        <div class="flex items-center justify-between text-[11px]">
          <span class="flex items-center gap-1.5 text-[var(--muted)]">
            <span class="w-2.5 h-2.5 rounded-[1px] border border-[var(--border)] bg-[var(--raised)]"></span>
            Under-Floor Adjustments
          </span>
          <span class="font-bold tabular-nums">${stats.adherence.underFloorDays} days</span>
        </div>
      </div>
    </section>

    <!-- Section 6: Full Interactive GitHub Matrix -->
    <div id="statsMatrixContainer"></div>
  `;

  // Render the Matrix
  const matrixContainer = section.querySelector('#statsMatrixContainer');
  if (matrixContainer) {
    renderHeatmap(matrixContainer, currentDateStr, (dateStr) => {
      if (onDateSelect) {
        onDateSelect(dateStr);
      }
    });
  }

  // Wire back button
  section.querySelector('#statsBackBtn').addEventListener('click', () => {
    if (onBack) onBack();
  });

  container.innerHTML = '';
  container.appendChild(section);
}
