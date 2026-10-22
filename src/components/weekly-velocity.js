/**
 * Weekly Velocity & Burn-Down Chart Component.
 * Industrial Brutalist ledger breakdown: Weekly cumulative completed hours per pillar
 * compared against total targets.
 */
import { getState } from '../core/state.js';
import { getDominos } from '../core/dominos.js';
import { getTotalDays, getDateStrFromOffset, getDayIndex, getCurrentDateStr } from '../utils/dates.js';

export function renderWeeklyVelocity(container, currentDateStr) {
  const state = getState();
  const dominos = getDominos();
  const totalDays = getTotalDays();
  const activeDayIndex = getDayIndex(currentDateStr);
  const currentWeekNumber = Math.floor(activeDayIndex / 7) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  // Group days by week and compute category breakdown
  // Categories: Workout (d1), Sketching (d2), CEED Paper (d3), Creative Work (d4)
  const weekStartDay = (currentWeekNumber - 1) * 7;
  const weekEndDay = Math.min(totalDays - 1, weekStartDay + 6);

  let weekTotalMinutesLogged = 0;
  let weekTargetMinutes = 0;

  // Breakdown metrics
  const categoryStats = {
    workout: { name: 'Morning Walk / Run', logged: 0, target: 0, color: 'var(--text)' },
    sketching: { name: 'Sketching & Fundamentals', logged: 0, target: 0, color: 'var(--chart-accent)' },
    paper: { name: 'CEED Timed Paper', logged: 0, target: 0, color: 'var(--text)' },
    creative: { name: 'Blender / Creative deep work', logged: 0, target: 0, color: 'var(--muted)' },
  };

  for (let i = weekStartDay; i <= weekEndDay; i++) {
    const dStr = getDateStrFromOffset(i);
    const rec = state.days[dStr];
    const isEmergency = rec?.emergency || false;

    dominos.forEach((dom) => {
      const standardMins = isEmergency ? dom.emergencyMins : dom.normalMins;
      const isCompleted = rec?.completed && rec.completed[dom.id];

      // Map to core categories
      let catKey = null;
      if (dom.id === 'd1' || dom.title.toLowerCase().includes('walk') || dom.title.toLowerCase().includes('run')) catKey = 'workout';
      else if (dom.id === 'd2' || dom.title.toLowerCase().includes('sketch')) catKey = 'sketching';
      else if (dom.id === 'd3' || dom.title.toLowerCase().includes('paper')) catKey = 'paper';
      else if (dom.id === 'd4' || dom.title.toLowerCase().includes('blender') || dom.title.toLowerCase().includes('creative')) catKey = 'creative';

      if (catKey) {
        categoryStats[catKey].target += standardMins;
        weekTargetMinutes += standardMins;
        if (isCompleted) {
          categoryStats[catKey].logged += standardMins;
          weekTotalMinutesLogged += standardMins;
        }
      }
    });
  }

  const completionPct = weekTargetMinutes > 0 ? Math.round((weekTotalMinutesLogged / weekTargetMinutes) * 100) : 0;
  const loggedHours = (weekTotalMinutesLogged / 60).toFixed(1);
  const targetHours = (weekTargetMinutes / 60).toFixed(1);

  const section = document.createElement('section');
  section.className = 'ledger-card p-4 font-mono';
  section.setAttribute('aria-label', 'Weekly velocity and burn-down ledger');

  section.innerHTML = `
    <div class="flex items-center justify-between border-b border-[var(--rule)] pb-2.5 mb-3">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">WEEKLY VELOCITY & BURNDOWN</h2>
        <p class="text-[10px] text-[var(--muted)] mt-0.5 font-sans">Week ${currentWeekNumber} of ${totalWeeks} · Days ${weekStartDay + 1}–${weekEndDay + 1}</p>
      </div>
      <div class="text-right">
        <span class="text-xs font-bold text-[var(--text)] tabular-nums">${loggedHours}h / ${targetHours}h</span>
        <span class="block text-[10px] text-[var(--muted)] tabular-nums">${completionPct}% closed</span>
      </div>
    </div>

    <!-- Master Burn-Down Progress Bar -->
    <div class="w-full h-2 bg-[var(--raised)] border border-[var(--border)] rounded-[1px] overflow-hidden mb-3.5">
      <div class="h-full bg-[var(--text)] transition-all duration-300" style="width: ${Math.min(100, completionPct)}%"></div>
    </div>

    <!-- Category Ledger Grid -->
    <div class="space-y-2 text-xs">
      ${Object.values(categoryStats).map((stat) => {
        const pct = stat.target > 0 ? Math.min(100, Math.round((stat.logged / stat.target) * 100)) : 0;
        const hLogged = (stat.logged / 60).toFixed(1);
        const hTarget = (stat.target / 60).toFixed(1);
        return `
          <div>
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="text-[var(--text)] font-medium font-sans truncate mr-2">${stat.name}</span>
              <span class="text-[var(--muted)] tabular-nums shrink-0">${hLogged}h / ${hTarget}h (${pct}%)</span>
            </div>
            <div class="w-full h-1 bg-[var(--raised)] border border-[var(--border)] rounded-[1px] overflow-hidden">
              <div class="h-full bg-[var(--chart-accent)] transition-all duration-300" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(section);
}
