// src/views/stats.js
import {
  getCumulativeTelemetry,
  getState,
  getBlocks,
  isDominoTask
} from '../core/state.js';
import { playRelayClick } from '../utils/sound.js';
import { showInAppToast } from '../components/header.js';

const CAMPAIGN_START = '2026-10-22';
const CAMPAIGN_DAYS = 87;
let inspectedDateStr = null;

export function renderStatsView(container) {
  const telemetry = getCumulativeTelemetry();
  const state = getState();
  const blocks = getBlocks();
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);

  const blockTotals = blocks.map(b => {
    let totalMins = 0;
    let completedDays = 0;
    for (const rec of Object.values(state.records || {})) {
      totalMins += Number(rec.durations?.[b.id]) || 0;
      if (Array.isArray(rec.completed) && rec.completed.includes(b.id)) completedDays += 1;
    }
    return {
      ...b,
      totalHours: (totalMins / 60).toFixed(1),
      completedDays
    };
  });

  const masteryPct = Math.min(100, Math.round((parseFloat(telemetry.totalProductiveHours) / 500) * 100));
  const partATargetTotal = CAMPAIGN_DAYS * 35; // 3045 questions
  const partAPct = Math.min(100, Math.round((telemetry.totalPartASolved / partATargetTotal) * 100));

  const matrixDays = [];
  const baseDate = new Date(CAMPAIGN_START + 'T00:00:00');
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

    const allDominosDone = rec && mandatoryIds.length > 0 && Array.isArray(rec.completed) && mandatoryIds.every(id => rec.completed.includes(id));

    matrixDays.push({
      dayNum: i + 1,
      dateStr: dStr,
      totalHours: (dayTotalMins / 60).toFixed(1),
      studyHours: (dayStudyMins / 60).toFixed(1),
      workHours: (dayWorkMins / 60).toFixed(1),
      partA: rec?.partACount || 0,
      allDominosDone,
      tier: getGreenTier(dayTotalMins)
    });
  }

  const inspected = matrixDays.find(d => d.dateStr === inspectedDateStr) || matrixDays.find(d => d.dateStr === new Date().toISOString().slice(0, 10)) || matrixDays[0];

  container.innerHTML = `
    <section class="w-full max-w-[420px] mx-auto px-3 pt-2 pb-24 font-mono select-none" aria-label="Athletic Telemetry Stats">
      <!-- 4 Big Number Athletic Telemetry Gauges -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="card-shell border border-[#FF69AF] bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">CUMULATIVE STUDY</div>
          <div class="text-2xl font-bold text-[#FF69AF] mt-1 mb-0.5">${telemetry.cumulativeStudyHours}h</div>
          <div class="text-[10px] text-neutral-500">Part A: ${telemetry.totalPartASolved} Qs</div>
        </div>

        <div class="card-shell border border-neutral-700 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">CUMULATIVE WORK</div>
          <div class="text-2xl font-bold text-white mt-1 mb-0.5">${telemetry.cumulativeWorkHours}h</div>
          <div class="text-[10px] text-neutral-500">Client + Studio Output</div>
        </div>

        <div class="card-shell border border-neutral-800 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">TOTAL PRODUCTIVE</div>
          <div class="text-2xl font-bold text-white mt-1 mb-0.5">${telemetry.totalProductiveHours}h</div>
          <div class="text-[10px] text-neutral-500">Walk: ${telemetry.cumulativeWalkHours}h</div>
        </div>

        <div class="card-shell border border-neutral-800 bg-[#0c0c0c] p-3 flex flex-col justify-between">
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider">DOMINO STREAK</div>
          <div class="text-2xl font-bold text-[#FF69AF] mt-1 mb-0.5">
            ${telemetry.streak}d <span class="text-xs font-normal text-neutral-400">/ ${telemetry.bestStreak}d</span>
          </div>
          <div class="text-[10px] text-neutral-500">LEVEL ${telemetry.level} • ${telemetry.totalCompletedDominos} DOMS</div>
        </div>
      </div>

      <!-- Peak Productive Hour Analyzer -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between text-[10px] uppercase mb-2">
          <span class="text-neutral-400">CIRCADIAN PEAK PRODUCTIVITY</span>
          <span class="px-2 py-0.5 bg-[#FF69AF] text-black font-extrabold rounded-full">${telemetry.topWindowName}</span>
        </div>
        <div class="flex flex-col gap-2">
          ${telemetry.peakWindows.map(w => `
            <div>
              <div class="flex justify-between text-[10px] mb-1">
                <span class="text-neutral-300">${w.label}</span>
                <span class="font-bold text-white">${w.hours}h (${w.pct}%)</span>
              </div>
              <div class="w-full h-2 bg-black border border-neutral-800 rounded-full overflow-hidden">
                <div class="liquid-progress h-full bg-[#FF69AF]" style="width: ${w.pct}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 500-Hour Mastery & 3,045 Part A Progress Bars -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3 flex flex-col gap-2.5">
        <div>
          <div class="flex justify-between text-[11px] font-bold mb-1">
            <span>500-HOUR CEED MASTERY LEDGER</span>
            <span class="text-[#FF69AF]">${telemetry.totalProductiveHours} / 500.0h (${masteryPct}%)</span>
          </div>
          <div class="w-full h-2.5 bg-black border border-neutral-700 rounded-full overflow-hidden">
            <div class="liquid-progress h-full bg-[#FF69AF]" style="width: ${masteryPct}%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-[11px] font-bold mb-1">
            <span>PART A CAMPAIGN (35 Qs × 87d)</span>
            <span class="text-white">${telemetry.totalPartASolved} / ${partATargetTotal} Qs (${partAPct}%)</span>
          </div>
          <div class="w-full h-2.5 bg-black border border-neutral-700 rounded-full overflow-hidden">
            <div class="liquid-progress h-full bg-white" style="width: ${partAPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Per-Domino Cumulative Hour Splits -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="text-[10px] text-neutral-400 uppercase mb-2">PER-PILLAR CUMULATIVE HOURS</div>
        <div class="flex flex-col gap-2">
          ${blockTotals.map(b => `
            <div class="flex items-center justify-between border-b border-neutral-900 pb-1.5 text-xs">
              <div class="truncate pr-2">
                <span class="btn-tactile text-[10px] px-1.5 py-0.5 ${isDominoTask(b) ? 'bg-[#FF69AF] text-black font-bold' : 'border border-neutral-700 text-neutral-400'}">${b.badge}</span>
                <span class="ml-1.5 font-bold">${b.name}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-bold text-white">${b.totalHours}h</span>
                <span class="text-[10px] text-neutral-500 ml-1">(${b.completedDays}d)</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 87-Day GitHub 5-Tier Green Contribution Matrix -->
      <div class="card-shell border border-neutral-800 bg-[#0a0a0a] p-3 mb-3" data-no-swipe>
        <div class="flex items-center justify-between text-[10px] text-neutral-400 uppercase mb-2">
          <span>87-DAY CAMPAIGN MATRIX (TAP CELL)</span>
          <span class="text-[#39d353] font-bold">OCT 22 – JAN 17</span>
        </div>

        <div class="grid gap-1 mb-2.5" style="grid-template-columns: repeat(13, minmax(0, 1fr));">
          ${matrixDays.map(cell => `
            <button
              data-matrix-date="${cell.dateStr}"
              class="aspect-square border rounded-[2px] ${cell.dateStr === inspected?.dateStr ? 'border-white ring-1 ring-white' : cell.allDominosDone ? 'border-[#FF69AF]' : 'border-neutral-900'} active:scale-90 transition-transform"
              style="background-color: ${cell.tier};"
              title="Day ${cell.dayNum} (${cell.dateStr}): ${cell.totalHours}h"
            ></button>
          `).join('')}
        </div>

        ${inspected ? `
          <div class="border border-neutral-800 bg-black/80 rounded p-2 text-[11px] flex items-center justify-between">
            <div>
              <span class="font-bold text-white">DAY ${inspected.dayNum} (${inspected.dateStr})</span>
              <div class="text-[10px] text-neutral-400">
                Study: ${inspected.studyHours}h • Work: ${inspected.workHours}h • Part A: ${inspected.partA}/35
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-[#39d353]">${inspected.totalHours} HRS</div>
              <div class="text-[10px] ${inspected.allDominosDone ? 'text-[#FF69AF] font-bold' : 'text-neutral-500'}">
                ${inspected.allDominosDone ? '★ COMPLETE' : 'INCOMPLETE'}
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Telemetry Export Controls -->
      <div class="grid grid-cols-2 gap-2">
        <button id="btn-export-csv" class="btn-tactile h-11 border border-white bg-[#0c0c0c] text-xs font-bold uppercase text-white active:bg-white active:text-black">
          ↓ EXPORT CSV
        </button>
        <button id="btn-export-json" class="btn-tactile h-11 border border-neutral-700 bg-[#0c0c0c] text-xs font-bold uppercase text-neutral-300 active:bg-white active:text-black">
          ↓ BACKUP JSON
        </button>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-matrix-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      inspectedDateStr = btn.getAttribute('data-matrix-date');
      playRelayClick();
      renderStatsView(container);
    });
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    playRelayClick();
    const rows = ['Date,BlockId,Category,Minutes,PartAQuestions'];
    for (const [dateStr, rec] of Object.entries(state.records || {})) {
      for (const [bId, mins] of Object.entries(rec.durations || {})) {
        const b = blocks.find(x => x.id === bId);
        rows.push(`${dateStr},${bId},${b ? b.category : 'CUSTOM'},${mins},${rec.partACount || 0}`);
      }
    }
    downloadFile('ceed-domino-telemetry.csv', rows.join('\n'), 'text/csv');
    showInAppToast('Telemetry CSV Downloaded');
  });

  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    playRelayClick();
    downloadFile('ceed-domino-backup.json', JSON.stringify(state, null, 2), 'application/json');
    showInAppToast('JSON Backup Downloaded');
  });
}

export function renderStats(container) {
  renderStatsView(container);
}

function getGreenTier(totalMins) {
  if (!totalMins || totalMins <= 0) return '#0c0c0c';
  if (totalMins < 120) return '#0e4429';
  if (totalMins < 240) return '#006d32';
  if (totalMins < 360) return '#26a641';
  return '#39d353';
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
