/**
 * GitHub-Style Contribution Heatmap — 87-day streak visualization.
 * Layout: Mon-Sun rows × weekly columns (like GitHub commit graph).
 */
import { getState } from '../core/state.js';
import { isDayComplete } from '../core/streak.js';
import { getTotalDays, getDateStrFromOffset } from '../utils/dates.js';

/** Get the day-of-week (0=Mon, 6=Sun) for a given date */
function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  // JS: 0=Sun, 1=Mon... 6=Sat -> Convert to 0=Mon... 6=Sun
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Get month short name for a date */
function getMonthLabel(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr + 'T00:00:00');
  return months[d.getMonth()];
}

/** Render the heatmap into a container */
export function renderHeatmap(container, currentDateStr, onDateSelect) {
  const state = getState();
  const totalDays = getTotalDays();

  // Build the grid data: organize days into weeks (columns)
  const weeks = [];
  let currentWeek = [];

  // Calculate the starting day of week for the first date
  const firstDateStr = getDateStrFromOffset(0);
  const startDow = getDayOfWeek(firstDateStr);

  // Fill empty cells before the first day
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  for (let i = 0; i < totalDays; i++) {
    const dateStr = getDateStrFromOffset(i);
    const rec = state.days[dateStr];
    const complete = isDayComplete(rec);

    currentWeek.push({
      dateStr,
      dayIndex: i,
      complete,
      emergency: rec?.emergency || false,
      shieldUsed: rec?.shieldUsed || false,
      isSelected: dateStr === currentDateStr,
    });

    // If this is Sunday (dow=6) or last day, push the week
    const dow = getDayOfWeek(dateStr);
    if (dow === 6 || i === totalDays - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Build month labels mapping to week indices
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

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  const section = document.createElement('section');
  section.className = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 transition-colors';
  section.setAttribute('aria-label', 'Streak contribution heatmap');

  section.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Momentum Grid</h2>
        <p class="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">Tap any square to jump to that day</p>
      </div>
      <div class="flex items-center gap-3 text-[10px] text-gray-400 dark:text-zinc-500">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-green-500"></span> Full</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Emergency</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Shield</span>
      </div>
    </div>

    <!-- Scrollable container for the contribution graph -->
    <div class="overflow-x-auto pb-1 pt-1">
      <div class="inline-block min-w-full">
        <!-- Month labels row -->
        <div class="flex ml-7 mb-1 text-[10px] text-gray-400 dark:text-zinc-500 h-4 relative" id="monthLabelsRow"></div>

        <!-- Main Heatmap Grid with Day Labels -->
        <div class="flex items-start">
          <!-- Day of week labels -->
          <div class="flex flex-col gap-1 mr-2 flex-shrink-0" id="dayLabelsCol"></div>
          <!-- Weeks columns -->
          <div class="flex gap-1 flex-shrink-0" id="weeksGrid"></div>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-400 dark:text-zinc-500">
      <span class="tabular-nums" id="completedCount"></span>
      <span class="tabular-nums" id="totalXP"></span>
    </div>
  `;

  // Render Month Labels with proper spacing
  const monthRow = section.querySelector('#monthLabelsRow');
  monthLabels.forEach((m) => {
    const span = document.createElement('span');
    span.className = 'absolute font-medium';
    // Each column is 14px (cell) + 4px (gap) = 18px
    span.style.left = `${m.weekIndex * 18}px`;
    span.textContent = m.label;
    monthRow.appendChild(span);
  });

  // Render Day Labels
  const dayCol = section.querySelector('#dayLabelsCol');
  dayLabels.forEach((label) => {
    const cell = document.createElement('span');
    cell.className = 'h-3.5 text-[9px] text-gray-400 dark:text-zinc-500 flex items-center justify-end font-medium leading-none';
    cell.textContent = label;
    dayCol.appendChild(cell);
  });

  // Render Weeks Grid
  const weeksGrid = section.querySelector('#weeksGrid');
  let completedCount = 0;

  weeks.forEach((week) => {
    const col = document.createElement('div');
    col.className = 'flex flex-col gap-1';

    week.forEach((day) => {
      const cell = document.createElement('button');
      cell.className = 'w-3.5 h-3.5 rounded-sm transition-all duration-150';

      if (!day) {
        cell.className += ' bg-transparent cursor-default pointer-events-none opacity-0';
        cell.disabled = true;
      } else {
        let bg = 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700';
        if (day.shieldUsed) {
          bg = 'bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-500/30';
          completedCount++;
        } else if (day.complete && day.emergency) {
          bg = 'bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/30';
          completedCount++;
        } else if (day.complete) {
          bg = 'bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/30';
          completedCount++;
        }

        const ring = day.isSelected
          ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 scale-110 z-10'
          : '';

        cell.className += ` ${bg} ${ring} cursor-pointer touch-manipulation hover:scale-105 active:scale-95`;
        cell.setAttribute('title', `Day ${day.dayIndex + 1}: ${day.dateStr}${day.complete ? ' (Completed)' : ''}`);
        cell.setAttribute('aria-label', `Day ${day.dayIndex + 1}: ${day.dateStr}${day.complete ? ' (Completed)' : ''}`);

        cell.addEventListener('click', () => {
          if (onDateSelect) onDateSelect(day.dateStr);
        });
      }

      col.appendChild(cell);
    });

    weeksGrid.appendChild(col);
  });

  // Update Stats at Bottom
  section.querySelector('#completedCount').textContent = `${completedCount} / ${totalDays} days completed`;
  section.querySelector('#totalXP').textContent = `${state.xp.toLocaleString()} total XP`;

  container.innerHTML = '';
  container.appendChild(section);
}
