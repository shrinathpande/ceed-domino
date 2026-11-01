// src/views/stats.js
import {
  getCumulativeTelemetry,
  getState,
  getBlocks,
  isDominoTask
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { icons } from '../components/icons.js';

const CAMPAIGN_START = '2026-10-22';
const CAMPAIGN_DAYS = 87;
let inspectedDateStr = null;

export function renderStatsView(container) {
  const telemetry = getCumulativeTelemetry();
  const state = getState();
  const blocks = getBlocks();
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);

  const totalProdHours = parseFloat(telemetry.totalProductiveHours) || 0;
  const masteryPct = Math.min(100, Math.round((totalProdHours / 500) * 100));

  const matrixDays = [];
  const baseDate = new Date(CAMPAIGN_START + 'T00:00:00');
  let activeDaysCount = 0;
  let fullDoneDaysCount = 0;

  for (let i = 0; i < CAMPAIGN_DAYS; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const rec = state.records?.[dStr];

    let dayStudyMins = 0;
    let dayWorkMins = 0;
    let dayTotalMins = 0;

    if (rec) {
      blocks.forEach(b => {
        const m = Number(rec.durations?.[b.id]) || 0;
        dayTotalMins += m;
        if (b.category === 'STUDY') dayStudyMins += m;
        if (b.category === 'WORK') dayWorkMins += m;
      });
    }

    if (dayTotalMins > 0) activeDaysCount++;

    const allDominosDone = rec && mandatoryIds.length > 0 && Array.isArray(rec.completed) && mandatoryIds.every(id => rec.completed.includes(id));
    if (allDominosDone) fullDoneDaysCount++;

    matrixDays.push({
      dayNum: i + 1,
      dateStr: dStr,
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalHours: (dayTotalMins / 60).toFixed(1),
      studyHours: (dayStudyMins / 60).toFixed(1),
      workHours: (dayWorkMins / 60).toFixed(1),
      allDominosDone,
      dayTotalMins
    });
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const inspected = matrixDays.find(d => d.dateStr === inspectedDateStr) || matrixDays.find(d => d.dateStr === todayIso) || matrixDays[0];

  const consistencyRate = Math.min(100, Math.round((activeDaysCount / Math.max(1, matrixDays.filter(d => d.dateStr <= todayIso).length)) * 100)) || 0;
  const avgHoursPerActiveDay = activeDaysCount > 0 ? (totalProdHours / activeDaysCount).toFixed(1) : '0.0';
  const topWindow = telemetry.peakWindows ? [...telemetry.peakWindows].sort((a, b) => b.mins - a.mins)[0] : null;

  // 6 Circular indicators for last 6 days up to today (Reference 2)
  const last6Days = [];
  const todayDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const mDay = matrixDays.find(x => x.dateStr === dStr);
    last6Days.push(mDay?.allDominosDone || false);
  }

  // Circadian pastels
  const circadianColors = {
    'Morning': '#FDE6B8',
    'Afternoon': '#A5C4FF',
    'Evening': '#C4B5FD',
    'Night': '#A7F3D0'
  };

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-4 pt-2 pb-28 font-pixel-square select-none" aria-label="Athletic Telemetry Stats">
      
      <!-- 1. Top Row: 2 Bento Cards (Reference 2 Top Row) -->
      <div class="grid grid-cols-2 gap-3 mb-3.5">
        <!-- Left Card: Double Check + Active Days -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-[#68A8F8]">
            <span>${icons.doubleCheck(18)}</span>
            <span class="text-[11px] font-medium text-[#71717A]">Campaign</span>
          </div>
          <div class="text-[26px] font-bold text-[#F4F4F6] tracking-tight my-1">
            ${activeDaysCount} <span class="text-sm font-normal text-[#71717A]">/ 87</span>
          </div>
          <div class="text-[12px] font-medium text-[#71717A]">Active Days</div>
        </div>

        <!-- Right Card: 500h Mastery with Reference 5 White + Hatch Bar -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[12px] font-medium text-[#71717A]">500h Mastery</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#C6F6D5] text-[#18794E]">
              ^ ${masteryPct}%
            </span>
          </div>
          <div class="text-[26px] font-bold text-[#F4F4F6] tracking-tight my-1 font-mono">
            ${totalProdHours.toFixed(1)}h
          </div>
          <!-- 3-Texture Progress Bar (Solid White + Hatch Stripe) -->
          <div class="w-full h-2.5 rounded-full overflow-hidden flex bg-[#18181B] border border-[#27272A]">
            <div class="h-full bg-[#F4F4F6] rounded-full transition-all duration-300" style="width: ${masteryPct}%;"></div>
            <div class="h-full hatch-stripes flex-1"></div>
          </div>
        </div>
      </div>

      <!-- 2. Consistency Matrix Card (Reference 2 Middle) -->
      <div class="bento-card mb-3.5" data-no-swipe>
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-1.5 text-sm font-medium text-[#71717A] mb-1">
              <span>Consistency</span>
              <span class="text-[#52525B]">${icons.helpCircle(13)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[#71717A]">${icons.refresh(14)}</span>
              <span class="text-[28px] font-bold text-[#F4F4F6] tracking-tight leading-none">${consistencyRate}%</span>
            </div>
          </div>
          <div class="text-[11px] font-mono text-[#71717A] pt-1">
            Oct 22 – Jan 17
          </div>
        </div>

        <!-- 13x7 Matrix: Single Soft Pastel Blue (#68A8F8) at 4 Opacities on #1C1C22 (Zero Glowing Box) -->
        <div class="grid gap-1 mb-3" style="grid-template-columns: repeat(13, minmax(0, 1fr));">
          ${matrixDays.map(cell => {
            const bg = getPastelBlueCellColor(cell.dayTotalMins);
            return `
              <button
                data-matrix-date="${cell.dateStr}"
                class="aspect-square rounded-[4px] transition-opacity btn-tactile hover:opacity-80"
                style="background-color: ${bg};"
                title="${cell.dateLabel}: ${cell.totalHours}h"
                aria-label="${cell.dateLabel}"
              ></button>
            `;
          }).join('')}
        </div>

        <!-- Clean 1-Line Inspection Subtitle (Reference 2) -->
        <div class="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-xs flex items-center justify-between">
          <div class="text-[#A1A1AA] font-medium">
            <strong class="text-[#F4F4F6] font-semibold">${inspected.dateLabel}</strong> • Study: ${inspected.studyHours}h • Work: ${inspected.workHours}h
          </div>
          <div class="font-mono font-bold text-[#68A8F8]">
            ${inspected.totalHours}h
          </div>
        </div>
      </div>

      <!-- 3. Current Streak & Longest Streak (Reference 2 Lower Middle) -->
      <div class="grid grid-cols-2 gap-3 mb-3.5">
        <!-- Current Streak with 6 Hollow/Filled 18px Circles -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">Current Streak</div>
          <div class="text-[26px] font-bold text-[#F4F4F6] tracking-tight my-1 flex items-center gap-1.5">
            <span>${icons.flame(18)}</span>
            <span>${telemetry.streak} days</span>
          </div>
          <!-- 6 hollow/filled 18px circles (Reference 2) -->
          <div class="flex items-center gap-1.5 pt-1">
            ${last6Days.map(done => `
              <div
                class="rounded-full transition-all"
                style="width: 18px; height: 18px; border: 1.5px solid #3F3F46; background-color: ${done ? '#68A8F8' : 'transparent'};"
              ></div>
            `).join('')}
          </div>
        </div>

        <!-- Longest Streak -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">Longest Streak</div>
          <div class="text-[26px] font-bold text-[#F4F4F6] tracking-tight my-1 flex items-center gap-1.5">
            <span>${icons.flame(18)}</span>
            <span>${telemetry.bestStreak} days</span>
          </div>
          <div class="text-[11px] font-medium text-[#71717A] truncate pt-1">
            Oct 22 - Jan 17, 2027
          </div>
        </div>
      </div>

      <!-- 4. Volume & Circadian Split (Reference 3 & 4) -->
      <div class="bento-card mb-3.5">
        <div class="flex items-baseline justify-between mb-2">
          <div class="text-[12px] font-medium text-[#71717A]">Volume & Circadian Split</div>
          <div class="text-xs font-mono text-[#A1A1AA]">
            Study <strong class="text-[#F4F4F6]">${telemetry.cumulativeStudyHours}h</strong> • Work <strong class="text-[#F4F4F6]">${telemetry.cumulativeWorkHours}h</strong>
          </div>
        </div>

        <!-- Sleek 6px Rounded Multi-Segment Bar with 4px Gaps (Reference 3 & 4) -->
        <div class="h-1.5 rounded-full overflow-hidden flex gap-1 bg-[#18181B] p-0 mb-3.5">
          ${(telemetry.peakWindows || []).map(w => {
            const col = circadianColors[w.label.split(' ')[0]] || '#A5C4FF';
            if (w.pct <= 0) return '';
            return `
              <div
                class="h-full rounded-full transition-all duration-300"
                style="width: ${Math.max(6, w.pct)}%; background-color: ${col};"
                title="${w.label}: ${w.hours}h (${w.pct}%)"
              ></div>
            `;
          }).join('')}
        </div>

        <!-- Soft Pastel Dot Legend -->
        <div class="grid grid-cols-2 gap-2 text-xs font-medium text-[#71717A]">
          ${(telemetry.peakWindows || []).map(w => {
            const key = w.label.split(' ')[0];
            const col = circadianColors[key] || '#A5C4FF';
            return `
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${col};"></span>
                <span class="text-[#F4F4F6]">${key}</span>
                <span class="font-mono text-[#71717A]">${w.pct}%</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 5. ✦ Domino Analysis Card (Reference 2 Bottom) -->
      <div class="bento-card p-4 mb-4 border border-[#27272A] bg-[#141416]">
        <div class="flex items-center gap-1.5 text-sm font-semibold text-[#FDBA74] tracking-wide mb-2">
          <span>${icons.sparkle(15)}</span>
          <span class="text-[#F4F4F6]">Domino Analysis</span>
        </div>
        <p class="text-[13px] text-[#9CA3AF] leading-relaxed">
          You completed all mandatory Dominos on
          <strong class="text-[#F4F4F6] font-semibold">${fullDoneDaysCount} out of ${activeDaysCount} active days</strong>.
          Your peak biological output occurs in the
          <strong class="text-[#F4F4F6] font-semibold">${topWindow?.key || 'Evening'} (${topWindow?.pct || 0}% of volume)</strong>,
          averaging <strong class="text-[#F4F4F6] font-semibold">${avgHoursPerActiveDay}h per active day</strong>.
        </p>
      </div>

      <!-- 6. Footer: Clean Flat Pill Buttons for Export CSV and Backup JSON -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          id="btn-export-csv"
          class="h-10 rounded-full bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#F4F4F6] flex items-center justify-center gap-1.5 btn-tactile"
        >
          <span>↓</span>
          <span>Export CSV</span>
        </button>
        <button
          id="btn-export-json"
          class="h-10 rounded-full bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-xs font-medium text-[#F4F4F6] flex items-center justify-center gap-1.5 btn-tactile"
        >
          <span>↓</span>
          <span>Backup JSON</span>
        </button>
      </div>
    </section>
  `;

  bindStatsEvents(container, state, blocks);
}

export function renderStats(container) {
  renderStatsView(container);
}

// Single Soft Pastel Blue (#68A8F8) at 4 Opacities on #1C1C22
function getPastelBlueCellColor(dayTotalMins) {
  if (!dayTotalMins || dayTotalMins <= 0) {
    return '#1C1C22';
  }
  if (dayTotalMins < 120) {
    return 'rgba(104, 168, 248, 0.25)';
  }
  if (dayTotalMins < 240) {
    return 'rgba(104, 168, 248, 0.50)';
  }
  if (dayTotalMins < 360) {
    return 'rgba(104, 168, 248, 0.75)';
  }
  return 'rgba(104, 168, 248, 1.0)';
}

function bindStatsEvents(container, state, blocks) {
  container.querySelectorAll('[data-matrix-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      inspectedDateStr = btn.getAttribute('data-matrix-date');
      playRelayClick();
      renderStatsView(container);
    });
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    playRelayClick();
    const rows = ['Date,BlockId,Category,Minutes'];
    for (const [dateStr, rec] of Object.entries(state.records || {})) {
      for (const [bId, mins] of Object.entries(rec.durations || {})) {
        const b = blocks.find(x => x.id === bId);
        rows.push(`${dateStr},${bId},${b ? b.category : 'CUSTOM'},${mins}`);
      }
    }
    downloadFile('ceed-domino-telemetry.csv', rows.join('\n'), 'text/csv');
  });

  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    playRelayClick();
    downloadFile('ceed-domino-backup.json', JSON.stringify(state, null, 2), 'application/json');
  });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
