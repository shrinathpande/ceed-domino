// src/views/stats.js
import {
  getCumulativeTelemetry,
  getState,
  getBlocks,
  isDominoTask,
  getAccentColor
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';

const CAMPAIGN_START = '2026-10-22';
const CAMPAIGN_DAYS = 87;
let inspectedDateStr = null;

export function renderStatsView(container) {
  const telemetry = getCumulativeTelemetry();
  const state = getState();
  const blocks = getBlocks();
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);
  const accentColor = getAccentColor();

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

  // 7 Circular indicators for last 7 days up to today
  const last7Days = [];
  const todayDate = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const mDay = matrixDays.find(x => x.dateStr === dStr);
    last7Days.push(mDay?.allDominosDone || false);
  }

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3.5 pt-2 pb-28 font-sans select-none" aria-label="Athletic Telemetry Stats">
      
      <!-- 1. Top Row: 2 Mini Bento Cards (Reference 2 Top Row) -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <!-- Mini Card 1: Active Days / Consistency -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">Active Days</div>
          <div class="text-[26px] font-extrabold text-white tracking-tight my-1">
            ✓✓ ${activeDaysCount} <span class="text-sm font-normal text-zinc-500">/ 87</span>
          </div>
          <div class="text-[11px] font-medium text-emerald-400">
            ${consistencyRate}% Consistency
          </div>
        </div>

        <!-- Mini Card 2: 500-Hour Mastery Progress -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">500h Mastery</div>
          <div class="text-[26px] font-extrabold text-[#34D399] tracking-tight my-1">
            ^ ${masteryPct}%
          </div>
          <!-- 3-Texture Progress Bar (Solid Emerald + Hatched Remaining Track) -->
          <div class="w-full h-2 rounded-full overflow-hidden flex bg-[#1A1A1F] border border-white/5">
            <div class="h-full bg-[#34D399] rounded-full transition-all duration-300" style="width: ${masteryPct}%;"></div>
            <div class="h-full bg-hatch flex-1"></div>
          </div>
        </div>
      </div>

      <!-- 2. Consistency & 87-Day Matrix Bento Card (Reference 2 Middle) -->
      <div class="bento-card mb-3" data-no-swipe>
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-[12px] font-medium text-[#71717A]">Consistency Matrix</div>
            <div class="text-xl font-bold text-white tracking-tight">87-Day Trajectory</div>
          </div>
          <div class="text-xl font-extrabold text-white font-mono tabular-nums">
            ${consistencyRate}%
          </div>
        </div>

        <!-- 13x7 Matrix with Sky-Blue / Accent Shades against #1C1C21 (Reference 2) -->
        <div class="grid gap-1 mb-3" style="grid-template-columns: repeat(13, minmax(0, 1fr));">
          ${matrixDays.map(cell => {
            const isSelected = cell.dateStr === inspected?.dateStr;
            const bgStyle = getMatrixCellColor(cell.dayTotalMins, accentColor);
            return `
              <button
                data-matrix-date="${cell.dateStr}"
                class="aspect-square rounded-[4px] transition-all btn-tactile ${
                  isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:opacity-80'
                }"
                style="${bgStyle}"
                title="${cell.dateLabel}: ${cell.totalHours}h"
                aria-label="${cell.dateLabel}"
              ></button>
            `;
          }).join('')}
        </div>

        <!-- Clean 1-Line Inspection Subtitle (Reference 2) -->
        <div class="p-2.5 rounded-xl bg-[#1A1A1F] border border-white/[0.04] text-xs flex items-center justify-between">
          <div class="text-zinc-300 font-medium">
            <strong class="text-white">${inspected.dateLabel}</strong> • Study: ${inspected.studyHours}h • Work: ${inspected.workHours}h
          </div>
          <div class="font-mono font-bold text-emerald-400">
            ${inspected.totalHours}h
          </div>
        </div>
      </div>

      <!-- 3. 2-Column Streak Bento (Reference 2 Lower Middle) -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <!-- Current Streak -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">Current Streak</div>
          <div class="text-[26px] font-extrabold text-white tracking-tight my-1.5 flex items-center gap-1.5">
            <span>🔥</span>
            <span>${telemetry.streak} days</span>
          </div>
          <!-- Row of 7 circular indicators (Reference 2) -->
          <div class="flex items-center gap-1.5 pt-1">
            ${last7Days.map(done => `
              <div
                class="w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? 'bg-[#34D399] shadow-sm shadow-[#34D399]/40'
                    : 'bg-[#1C1C21] border border-white/10'
                }"
              ></div>
            `).join('')}
          </div>
        </div>

        <!-- Longest Streak -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="text-[12px] font-medium text-[#71717A]">Longest Streak</div>
          <div class="text-[26px] font-extrabold text-white tracking-tight my-1.5 flex items-center gap-1.5">
            <span>🔥</span>
            <span>${telemetry.bestStreak} days</span>
          </div>
          <div class="text-[11px] font-medium text-zinc-500 truncate pt-1">
            Oct 22 – Jan 17, 2027
          </div>
        </div>
      </div>

      <!-- 4. Portfolio-Style Study vs. Work & Circadian Allocation Card (Reference 3) -->
      <div class="bento-card mb-3">
        <div class="flex items-baseline justify-between mb-2">
          <div class="text-[12px] font-medium text-[#71717A]">Volume & Allocation</div>
          <div class="text-xs font-mono font-bold text-zinc-400">
            Study <strong class="text-white">${telemetry.cumulativeStudyHours}h</strong> • Work <strong class="text-white">${telemetry.cumulativeWorkHours}h</strong>
          </div>
        </div>

        <!-- Multi-Segment Horizontal Bar with 4px Gaps (Reference 3) -->
        <div class="h-2 rounded-full overflow-hidden flex gap-1 bg-[#1A1A1F] p-0.5 mb-3.5">
          ${(telemetry.peakWindows || []).map((w, idx) => {
            const colors = ['#38BDF8', '#34D399', '#A855F7', '#F59E0B'];
            const col = colors[idx % colors.length];
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

        <!-- Clean Dot Legend (Reference 3) -->
        <div class="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-400">
          ${(telemetry.peakWindows || []).map((w, idx) => {
            const colors = ['#38BDF8', '#34D399', '#A855F7', '#F59E0B'];
            const col = colors[idx % colors.length];
            return `
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${col};"></span>
                <span class="text-zinc-300">${w.label.split(' ')[0]}</span>
                <span class="font-mono text-zinc-500">${w.pct}%</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 5. ✦ Domino Intelligence Narrative Card (Reference 2 Bottom) -->
      <div class="bento-card border border-amber-500/20 bg-[#141210] mb-3.5">
        <div class="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] tracking-wide mb-2 uppercase">
          <span>✦</span>
          <span>Domino Intelligence</span>
        </div>
        <p class="text-xs text-[#A1A1AA] leading-relaxed">
          You completed all mandatory Dominos on
          <strong class="text-white font-bold">${fullDoneDaysCount} out of ${activeDaysCount} active days</strong>.
          Your peak biological output occurs in the
          <strong class="text-white font-bold">${topWindow?.key || 'Evening'} (${topWindow?.pct || 0}% of volume)</strong>,
          averaging <strong class="text-white font-bold">${avgHoursPerActiveDay}h per active day</strong>.
        </p>
      </div>

      <!-- 6. Footer: Clean Pill Buttons for Export CSV and Backup JSON -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          id="btn-export-csv"
          class="h-11 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 btn-tactile"
        >
          <span>↓</span>
          <span>Export CSV</span>
        </button>
        <button
          id="btn-export-json"
          class="h-11 rounded-full bg-[#1A1A1F] border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 btn-tactile"
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

function getMatrixCellColor(dayTotalMins, accentColor) {
  if (!dayTotalMins || dayTotalMins <= 0) {
    return 'background-color: #1C1C21;';
  }
  if (dayTotalMins < 120) {
    return `background-color: ${accentColor}40;`;
  }
  if (dayTotalMins < 240) {
    return `background-color: ${accentColor}70;`;
  }
  if (dayTotalMins < 360) {
    return `background-color: ${accentColor}A5;`;
  }
  return `background-color: ${accentColor}; box-shadow: 0 0 6px ${accentColor}80;`;
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
