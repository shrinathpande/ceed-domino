/**
 * GitHub-Style Contribution Heatmap — 87-day streak visualization.
 * Industrial brutalist matrix: 7-row days by week columns with high-contrast indicator states.
 */
import { getState, getAllCompletedTasksCount } from '../core/state.js';
import { isDayComplete } from '../core/streak.js';
import { getTotalDays, getDateStrFromOffset } from '../utils/dates.js';

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

export function renderHeatmap(container, currentDateStr, onDateSelect) {
  const state = getState();
  const totalDays = getTotalDays();

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

    currentWeek.push({
      dateStr,
      dayIndex: i,
      complete,
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
  section.className = 'ledger-card p-4';
  section.setAttribute('aria-label', '87-day momentum ledger matrix');

  section.innerHTML = `
    <div class="flex items-center justify-between mb-3 border-b border-[var(--rule)] pb-2 font-mono">
      <div>
        <h2 class="text-sm font-semibold text-[var(--text)]">Momentum matrix</h2>
        <p class="text-[10px] text-[var(--muted)] mt-0.5">Oct 22, 2026 – Jan 17, 2027 · Select node to jump</p>
      </div>
      <div class="flex items-center gap-2.5 text-[10px] text-[var(--muted)]">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--text)]"></span> Full</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--warning)]"></span> Emergency</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-[1px] bg-[var(--chart-accent)]"></span> Shield</span>
      </div>
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

    <!-- Stats row -->
    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--rule)] text-[11px] font-mono text-[var(--muted)]">
      <span class="tabular-nums" id="completedCount"></span>
      <span class="tabular-nums" id="tasksMetric"></span>
    </div>
  `;

  const monthRow = section.querySelector('#monthLabelsRow');
  monthLabels.forEach((m) => {
    const span = document.createElement('span');
    span.className = 'absolute font-medium uppercase text-[10px]';
    span.style.left = `${m.weekIndex * 18}px`;
    span.textContent = m.label;
    monthRow.appendChild(span);
  });

  const dayCol = section.querySelector('#dayLabelsCol');
  dayLabels.forEach((label) => {
    const cell = document.createElement('span');
    cell.className = 'h-3.5 text-[9px] font-mono text-[var(--muted)] flex items-center justify-end font-semibold leading-none w-3';
    cell.textContent = label;
    dayCol.appendChild(cell);
  });

  const weeksGrid = section.querySelector('#weeksGrid');
  let completedCount = 0;

  weeks.forEach((week) => {
    const col = document.createElement('div');
    col.className = 'flex flex-col gap-1';

    week.forEach((day) => {
      const cell = document.createElement('button');
      cell.className = 'w-3.5 h-3.5 rounded-[1px] transition-colors';

      if (!day) {
        cell.className += ' bg-transparent cursor-default pointer-events-none opacity-0';
        cell.disabled = true;
      } else {
        let bg = 'bg-[var(--raised)] border border-[var(--border)]';
        if (day.shieldUsed) {
          bg = 'bg-[var(--chart-accent)] border border-[var(--chart-accent)] text-white';
          completedCount++;
        } else if (day.complete && day.emergency) {
          bg = 'bg-[var(--warning)] border border-[var(--warning)] text-white';
          completedCount++;
        } else if (day.complete) {
          bg = 'bg-[var(--text)] border border-[var(--text)] text-[var(--surface)]';
          completedCount++;
        }

        const ring = day.isSelected
          ? 'outline outline-2 outline-[var(--text)] outline-offset-1 z-10'
          : '';

        cell.className += ` ${bg} ${ring} cursor-pointer touch-manipulation hover:border-[var(--text)]`;
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

  const totalTasks = getAllCompletedTasksCount();
  section.querySelector('#completedCount').textContent = `${completedCount} / ${totalDays} DAYS COMPLETE`;
  section.querySelector('#tasksMetric').textContent = `${totalTasks} TASKS LOGGED`;

  container.innerHTML = '';
  container.appendChild(section);
}
