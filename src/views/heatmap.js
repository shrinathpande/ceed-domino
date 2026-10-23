/**
 * GitHub-Style Contribution Heatmap — 87-Day Green Square Matrix.
 * Authentic GitHub profile contribution matrix with 5 intensity levels, hover popover tooltips,
 * and high-contrast emergency & shield status badges.
 */
import { getState, getAllCompletedTasksCount, getGrandTotalLoggedMinutes, formatHours, formatDetailedHours } from '../core/state.js';
import { isDayComplete } from '../core/streak.js';
import { getTotalDays, getDateStrFromOffset } from '../utils/dates.js';
import { getDayFocusMinutes, getGitHubIntensityLevel } from '../core/telemetry.js';
import { getDominos, isDominoTask } from '../core/dominos.js';

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getMonthLabel(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr + 'T00:00:00');
  return months[d.getMonth()];
}

function formatReadableDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function renderHeatmap(container, currentDateStr, onDateSelect) {
  const state = getState();
  const totalDays = getTotalDays();
  const dominos = getDominos().filter((d) => isDominoTask(d));

  const weeks = [];
  let currentWeek = [];

  const firstDateStr = getDateStrFromOffset(0);
  const startDow = getDayOfWeek(firstDateStr);

  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  for (let i = 0; i < totalDays; i++) {
    const dateStr = getDateStrFromOffset(i);
    const rec = state.days[dateStr];
    const complete = isDayComplete(rec);
    const focusMins = getDayFocusMinutes(dateStr);
    const intensity = getGitHubIntensityLevel(dateStr);

    let completedDominosCount = 0;
    if (rec && rec.completed) {
      completedDominosCount = dominos.filter((d) => rec.completed[d.id]).length;
    }

    currentWeek.push({
      dateStr,
      dayIndex: i,
      complete,
      focusMins,
      intensity,
      completedDominosCount,
      emergency: rec?.emergency || false,
      shieldUsed: rec?.shieldUsed || false,
      isSelected: dateStr === currentDateStr,
    });

    const dow = getDayOfWeek(dateStr);
    if (dow === 6 || i === totalDays - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const monthLabels = [];
  let lastMonth = null;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d !== null);
    if (firstDay) {
      const month = getMonthLabel(firstDay.dateStr);
      if (month !== lastMonth) {
        monthLabels.push({ weekIndex, label: month });
        lastMonth = month;
      }
    }
  });

  const dayLabels = ['M', '', 'W', '', 'F', '', 'S'];

  const section = document.createElement('section');
  section.className = 'ledger-card p-4 relative';
  section.setAttribute('aria-label', '87-day GitHub contribution matrix');

  section.innerHTML = `
    <!-- Matrix Header -->
    <div class="flex items-center justify-between mb-3 border-b border-[var(--rule)] pb-2 font-mono">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-[var(--text)] tracking-wider uppercase">Contribution Matrix</h2>
          <span class="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] font-bold text-[var(--muted)]">87-DAY MATRIX</span>
        </div>
        <p class="text-[10px] text-[var(--muted)] mt-0.5 font-sans">Oct 22, 2026 – Jan 17, 2027 · Green volume scales with study focus</p>
      </div>
      
      <!-- GitHub Intensity Legend -->
      <div class="flex items-center gap-1.5 text-[9px] font-mono text-[var(--muted)]">
        <span>Less</span>
        <span class="w-3 h-3 rounded-[2px]" style="background-color: var(--gh-l0); border: 1px solid var(--border);" title="0 hours"></span>
        <span class="w-3 h-3 rounded-[2px]" style="background-color: var(--gh-l1);" title="< 4 hours (Under Floor)"></span>
        <span class="w-3 h-3 rounded-[2px]" style="background-color: var(--gh-l2);" title="4–6 hours (Standard Floor)"></span>
        <span class="w-3 h-3 rounded-[2px]" style="background-color: var(--gh-l3);" title="6–8 hours (Over-Delivered)"></span>
        <span class="w-3 h-3 rounded-[2px]" style="background-color: var(--gh-l4);" title="8+ hours (Studio Beast Mode)"></span>
        <span>More</span>
      </div>
    </div>

    <!-- Active Hover / Tap Tooltip HUD Banner -->
    <div id="matrixTooltipHud" class="mb-2.5 px-2.5 py-1.5 rounded-[2px] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-between text-xs font-mono transition-opacity">
      <span id="tooltipContent" class="text-[var(--text)] font-medium">Tap or hover any square to inspect metrics</span>
      <span id="tooltipBadge" class="text-[10px] text-[var(--muted)]">CEED 2027</span>
    </div>

    <!-- Scrollable container for the contribution graph -->
    <div class="overflow-x-auto pb-1 pt-1">
      <div class="inline-block min-w-full">
        <!-- Month labels row -->
        <div class="flex ml-5 mb-1 text-[10px] font-mono text-[var(--muted)] h-4 relative" id="monthLabelsRow"></div>

        <!-- Main Heatmap Grid with Day Labels -->
        <div class="flex items-start">
          <!-- Day of week labels -->
          <div class="flex flex-col gap-1 mr-1.5 flex-shrink-0" id="dayLabelsCol"></div>
          <!-- Weeks columns -->
          <div class="flex gap-1 flex-shrink-0" id="weeksGrid"></div>
        </div>
      </div>
    </div>

    <!-- Stats summary footer -->
    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--muted)]">
      <span class="tabular-nums" id="completedCount"></span>
      <span class="tabular-nums" id="tasksMetric"></span>
    </div>
  `;

  // Render Month Labels
  const monthRow = section.querySelector('#monthLabelsRow');
  monthLabels.forEach((m) => {
    const span = document.createElement('span');
    span.className = 'absolute font-medium uppercase text-[10px] tracking-wider';
    span.style.left = `${m.weekIndex * 18}px`;
    span.textContent = m.label;
    monthRow.appendChild(span);
  });

  // Render Day Labels (M, W, F)
  const dayCol = section.querySelector('#dayLabelsCol');
  dayLabels.forEach((label) => {
    const cell = document.createElement('span');
    cell.className = 'h-3.5 text-[9px] font-mono text-[var(--muted)] flex items-center justify-end font-semibold leading-none w-3';
    cell.textContent = label;
    dayCol.appendChild(cell);
  });

  const tooltipText = section.querySelector('#tooltipContent');
  const tooltipBadge = section.querySelector('#tooltipBadge');

  const updateHud = (day) => {
    if (!day) return;
    const formatted = formatReadableDate(day.dateStr);
    const hours = (day.focusMins / 60).toFixed(1);
    
    let statusText = '';
    if (day.focusMins > 0) {
      statusText = `<strong>${hours} hrs</strong> on ${formatted} · ${day.completedDominosCount}/4 Dominos`;
    } else {
      statusText = `No focus logged on ${formatted}`;
    }

    if (day.emergency) {
      statusText += ' <span class="text-[var(--warning)] font-bold">[BAD-DAY FLOOR]</span>';
    }
    if (day.shieldUsed) {
      statusText += ' <span class="text-[var(--chart-accent)] font-bold">[SHIELD]</span>';
    }

    tooltipText.innerHTML = statusText;
    tooltipBadge.textContent = `Day ${day.dayIndex + 1} of 87`;
  };

  // Render Matrix Cells
  const weeksGrid = section.querySelector('#weeksGrid');
  let completedCount = 0;

  weeks.forEach((week) => {
    const col = document.createElement('div');
    col.className = 'flex flex-col gap-1';

    week.forEach((day) => {
      const cell = document.createElement('button');
      cell.className = 'w-3.5 h-3.5 rounded-[2px] transition-all relative';

      if (!day) {
        cell.className += ' bg-transparent cursor-default pointer-events-none opacity-0';
        cell.disabled = true;
      } else {
        if (day.complete) completedCount++;

        // Base background according to GitHub Green Level
        const levelVar = `var(--gh-l${day.intensity})`;
        cell.style.backgroundColor = levelVar;
        cell.style.borderColor = day.intensity === 0 ? 'var(--border)' : 'transparent';
        cell.style.borderWidth = '1px';

        // Additional signal borders for Emergency / Shield
        if (day.emergency) {
          cell.style.outline = '1.5px solid var(--warning)';
          cell.style.outlineOffset = '-1px';
        } else if (day.shieldUsed) {
          cell.style.outline = '1.5px solid var(--chart-accent)';
          cell.style.outlineOffset = '-1px';
        }

        // Selected Day Indicator
        if (day.isSelected) {
          cell.className += ' ring-2 ring-[var(--text)] ring-offset-1 z-10';
        }

        cell.className += ' cursor-pointer touch-manipulation hover:scale-125';
        cell.setAttribute('aria-label', `Day ${day.dayIndex + 1}: ${day.dateStr}, ${(day.focusMins / 60).toFixed(1)} hours`);

        // Hover & tap events to update Tooltip HUD
        cell.addEventListener('mouseenter', () => updateHud(day));
        cell.addEventListener('focus', () => updateHud(day));

        cell.addEventListener('click', () => {
          updateHud(day);
          if (onDateSelect) onDateSelect(day.dateStr);
        });

        // Set default HUD to current selected date
        if (day.isSelected) {
          updateHud(day);
        }
      }

      col.appendChild(cell);
    });

    weeksGrid.appendChild(col);
  });

  const totalTasks = getAllCompletedTasksCount();
  const grandTotalMins = getGrandTotalLoggedMinutes();
  section.querySelector('#completedCount').textContent = `${completedCount} / ${totalDays} DAYS COMPLETE · ${totalTasks} TASKS`;
  section.querySelector('#tasksMetric').textContent = `Σ ${formatHours(grandTotalMins)} TOTAL HOURS`;

  container.innerHTML = '';
  container.appendChild(section);
}
