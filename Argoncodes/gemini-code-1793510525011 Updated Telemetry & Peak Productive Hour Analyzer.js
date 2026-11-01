// src/views/stats.js
import {
  getCumulativeTelemetry,
  getState,
  getBlocks,
  isDominoTask
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

  const blockTotals = blocks.map(b => {
    let totalMins = 0;
    let completedDays = 0;
    for (const rec of Object.values(state.records || {})) {
      totalMins += rec.durations?.[b.id] || 0;
      if ((rec.completed || []).includes(b.id)) completedDays += 1;
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
        const m = rec.durations?.[b.id] || 0;
        dayTotalMins += m;
        if (b.category === 'STUDY') dayStudyMins += m;
        if (b.category === 'WORK') dayWorkMins += m;
      });
    }

    const allDominosDone = rec && mandatoryIds.length > 0 && mandatoryIds.every(id => (rec.completed || []).includes(id));

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
    <section class="w-full max-w-[390px] mx-auto px-3 pt-2 pb-24 font-mono text-white select-none">
      <!-- 4 Big Number Athletic Telemetry Gauges -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="border-2 border-[#FF69AF] bg-[#0a0a0a] p-3">
          <div class="text-[10px] text-neutral-400 uppercase">CUMULATIVE STUDY</div>
          <div class="text-2xl font-bold text-[#FF69AF] mt-0.5">${telemetry.cumulativeStudyHours}h</div>
          <div class="text-[10px] text-neutral-500">Part A: ${telemetry.totalPartASolved} Qs</div>
        </div>

        <div class="border-2 border-white bg-[#0a0a0a] p-3">
          <div class="text-[10px] text-neutral-400 uppercase">CUMULATIVE WORK</div>
          <div class="text-2xl font-bold text-white mt-0.5">${telemetry.cumulativeWorkHours}h</div>
          <div class="text-[10px] text-neutral-500">Client + Studio Output</div>
        </div>

        <div class="border-2 border-neutral-700 bg-[#0a0a0a] p-3">
          <div class="text-[10px] text-neutral-400 uppercase">TOTAL PRODUCTIVE</div>
          <div class="text-xl font-bold text-white mt-0.5">${telemetry.totalProductiveHours}h</div>
          <div class="text-[10px] text-neutral-500">Walk: ${telemetry.cumulativeWalkHours}h included</div>
        </div>

        <div class="border-2 border-neutral-700 bg-[#0a0a0a] p-3">
          <div class="text-[10px] text-neutral-400 uppercase">DOMINO STREAK</div>
          <div class="text-xl font-bold text-[#FF69AF] mt-0.5">${telemetry.streak}d <span class="text-xs text-neutral-400">/ ${telemetry.bestStreak}d</span></div>
          <div class="text-[10px] text-neutral-500">LEVEL ${telemetry.level} • ${telemetry.totalCompletedDominos} DOMS</div>
        </div>
      </div>

      <!-- Peak Productive Hour Analyzer -->
      <div class="border-2 border-white bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between text-[10px] uppercase mb-2">
          <span class="text-neutral-400">PEAK BIOLOGICAL OUTPUT</span>
          <span class="px-1.5 py-0.5 bg-[#FF69AF] text-black font-bold">${telemetry.topWindowName}</span>
        </div>
        <div class="flex flex-col gap-2">
          ${telemetry.peakWindows.map(w => `
            <div>
              <div class="flex justify-between text-[10px] mb-0.5">
                <span class="text-neutral-300">${w.label}</span>
                <span class="font-bold text-white">${w.hours}h (${w.pct}%)</span>
              </div>
              <div class="w-full h-2 bg-black border border-neutral-800">
                <div class="h-full bg-[#FF69AF]" style="width: ${w.pct}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 500-Hour Mastery & 3,045 Part A Progress Bars -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3 flex flex-col gap-2.5">
        <div>
          <div class="flex justify-between text-[11px] font-bold mb-1">
            <span>500-HOUR MASTERY LEDGER</span>
            <span class="text-[#FF69AF]">${telemetry.totalProductiveHours} / 500.0 HRS (${masteryPct}%)</span>
          </div>
          <div class="w-full h-2 bg-black border border-neutral-700">
            <div class="h-full bg-[#FF69AF]" style="width: ${masteryPct}%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-[11px] font-bold mb-1">
            <span>PART A CAMPAIGN (35 Qs × 87d)</span>
            <span class="text-white">${telemetry.totalPartASolved} / ${partATargetTotal} Qs (${partAPct}%)</span>
          </div>
          <div class="w-full h-2 bg-black border border-neutral-700">
            <div class="h-full bg-white" style="width: ${partAPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Per-Domino Cumulative Hour Splits -->
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="text-[10px] text-neutral-400 uppercase mb-2">PER-PILLAR CUMULATIVE HOURS</div>
        <div class="flex flex-col gap-2">
          ${blockTotals.map(b => `
            <div class="flex items-center justify-between border-b border-neutral-900 pb-1.5 text-xs">
              <div class="truncate pr-2">
                <span class="text-[10px] px-1 ${isDominoTask(b) ? 'bg-[#FF69AF] text-black font-bold' : 'border border-neutral-700 text-neutral-400'}">${b.badge}</span>
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
      <div class="border-2 border-neutral-800 bg-[#0a0a0a] p-3 mb-3">
        <div class="flex items-center justify-between text-[10px] text-neutral-400 uppercase mb-2">
          <span>87-DAY CAMPAIGN MATRIX (TAP CELL)</span>
          <span class="text-[#39d353]">OCT 22 – JAN 17</span>
        </div>

        <div class="grid gap-1 mb-2.5" style="grid-template-columns: repeat(13, minmax(0, 1fr));">
          ${matrixDays.map(cell => `
            <button
              data-matrix-date="${cell.dateStr}"
              class="aspect-square border ${cell.dateStr === inspected?.dateStr ? 'border-white' : cell.allDominosDone ? 'border-[#FF69AF]' : 'border-neutral-900'}"
              style="background-color: ${cell.tier};"
              title="Day ${cell.dayNum}: ${cell.totalHours}h"
            ></button>
          `).join('')}
        </div>

        ${inspected ? `
          <div class="border border-neutral-800 bg-black p-2 text-[11px] flex items-center justify-between">
            <div>
              <span class="font-bold text-white">DAY ${inspected.dayNum} (${inspected.dateStr})</span>
              <div class="text-[10px] text-neutral-400">
                Study: ${inspected.studyHours}h • Work: ${inspected.workHours}h • Part A: ${inspected.partA}/35
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-[#39d353]">${inspected.totalHours} HRS</div>
              <div class="text-[10px] ${inspected.allDominosDone ? 'text-[#FF69AF]' : 'text-neutral-500'}">
                ${inspected.allDominosDone ? '★ DOMINOS COMPLETE' : 'INCOMPLETE'}
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Telemetry Export Controls -->
      <div class="grid grid-cols-2 gap-2">
        <button id="btn-export-csv" class="h-11 border-2 border-white bg-[#0a0a0a] text-xs font-bold uppercase active:bg-white active:text-black">
          ↓ EXPORT CSV
        </button>
        <button id="btn-export-json" class="h-11 border-2 border-neutral-700 bg-[#0a0a0a] text-xs font-bold uppercase active:bg-white active:text-black">
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
  });

  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    playRelayClick();
    downloadFile('ceed-domino-backup.json', JSON.stringify(state, null, 2), 'application/json');
  });
}

function getGreenTier(totalMins) {
  if (!totalMins || totalMins <= 0) return '#0a0a0a';
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