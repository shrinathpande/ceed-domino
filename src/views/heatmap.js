/**
 * GitHub-Style Contribution Heatmap — 87-day streak visualization.
 * Layout: Mon-Sun rows × weekly columns (like GitHub commit graph).
 */
import { getState, ensureDayRecord } from '../core/state.js';
import { isDayComplete } from '../core/streak.js';
import { getTotalDays, getDateStrFromOffset, getStartDate } from '../utils/dates.js';

/** Get the day-of-week (0=Mon, 6=Sun) for a given date */
function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  // JS: 0=Sun,1=Mon...6=Sat → Convert to 0=Mon...6=Sun
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Get month label for a date */
function getMonthLabel(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr + 'T00:00:00');
  return months[d.getMonth()];
}

/** Render the heatmap into a container */
export function renderHeatmap(container, currentDateStr, onDateSelect) {
  const state = getState();
  const totalDays = getTotalDays();
  const startDate = getStartDate();

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
      // Pad remaining cells if last week is incomplete
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Build month labels
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
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-green-500"></span> Full</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Emergency</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Shield</span>
      </div>
    </div>

    <!-- Month labels -->
    <div class="flex ml-7 mb-1 text-[10px] text-gray-400 dark:text-zinc-500" id="monthLabelsRow"></div>

    <!-- Grid -->
    <div class="flex gap-0.5">
      <!-- Day labels column -->
      <div class="flex flex-col gap-0.5 mr-1" id="dayLabelsCol"></div>
      <!-- Weeks grid -->
      <div class="flex gap-0.5 overflow-x-auto" id="weeksGrid"></div>
    </div>

    <!-- Stats row -->
    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-400 dark:text-zinc-500">
      <span class="tabular-nums" id="completedCount">0 / \${totalDays} days completed</span>
      <span class="tabular-nums" id="totalXP">0 total XP</span>
    </div>
  `;

  // Render month labels
  const monthRow = section.querySelector('#monthLabelsRow');
  // This is complex to position perfectly — use a simplified approach
  let monthHTML = '';
  weeks.forEach((week, idx) => {
    const label = monthLabels.find((m) => m.weekIndex === idx);
    monthHTML += `<span class="w-[13px] text-center flex-shrink-0">\${label ? label.label : ''}</span>`;
  });
  monthRow.innerHTML = monthHTML;

  // Render day labels
  const dayCol = section.querySelector('#dayLabelsCol');
  dayLabels.forEach((label) => {
    const cell = document.createElement('span');
    cell.className = 'h-[13px] text-[9px] text-gray-400 dark:text-zinc-500 flex items-center justify-end pr-1';
    cell.textContent = label;
    dayCol.appendChild(cell);
  });

  // Render weeks grid
  const weeksGrid = section.querySelector('#weeksGrid');
  let completedCount = 0;

  weeks.forEach((week) => {
    const col = document.createElement('div');
    col.className = 'flex flex-col gap-0.5';

    week.forEach((day) => {
      const cell = document.createElement('button');
      cell.className = 'w-[13px] h-[13px] rounded-sm transition-colors';

      if (!day) {
        cell.className += ' bg-transparent cursor-default';
        cell.disabled = true;
      } else {
        let bg = 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700';
        if (day.shieldUsed) {
          bg = 'bg-blue-500 hover:bg-blue-600';
          completedCount++;
        } else if (day.complete && day.emergency) {
          bg = 'bg-amber-500 hover:bg-amber-600';
          completedCount++;
        } else if (day.complete) {
          bg = 'bg-green-500 hover:bg-green-600';
          completedCount++;
        }

        const ring = day.isSelected ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : '';
        cell.className += ` \${bg} \${ring} cursor-pointer touch-manipulation`;
        cell.setAttribute('aria-label', `Day \${day.dayIndex + 1}: \${day.dateStr}\${day.complete ? ' (completed)' : ''}`);

        cell.addEventListener('click', () => {
          if (onDateSelect) onDateSelect(day.dateStr);
        });
      }

      col.appendChild(cell);
    });

    weeksGrid.appendChild(col);
  });

  // Update stats
  section.querySelector('#completedCount').textContent = `\${completedCount} / \${totalDays} days completed`;
  section.querySelector('#totalXP').textContent = `\${getState().xp.toLocaleString()} total XP`;

  container.innerHTML = '';
  container.appendChild(section);
}
