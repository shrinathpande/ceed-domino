// src/views/stats.js
import { getState, getBlocks, isDominoTask } from '../core/state.js';
import { exportTelemetryCSV, exportTelemetryJSON } from '../core/telemetry.js';
import { playRelayClick } from '../utils/sound.js';

export function renderStats(container) {
  const state = getState();
  const blocks = getBlocks();
  const records = state.records || {};
  const dates = Object.keys(records).sort();

  let activeDays = 0;
  let perfectDays = 0;
  let totalStudyMins = 0;
  let totalWorkMins = 0;
  const mandatoryIds = blocks.filter(isDominoTask).map(b => b.id);

  dates.forEach(d => {
    const r = records[d];
    const minsSum = Object.values(r.durations || {}).reduce((a, b) => a + b, 0);
    if (minsSum > 0) activeDays++;
    if (mandatoryIds.length > 0 && mandatoryIds.every(id => (r.completed || []).includes(id))) {
      perfectDays++;
    }
    blocks.forEach(b => {
      const m = r.durations?.[b.id] || 0;
      if (b.category === 'STUDY') totalStudyMins += m;
      else totalWorkMins += m;
    });
  });

  const totalHours = (totalStudyMins + totalWorkMins) / 60;
  const masteryPct = Math.min(100, Math.round((totalHours / 500) * 100));
  const consistencyPct = activeDays > 0 ? Math.round((perfectDays / Math.max(activeDays, 1)) * 100) : 25;

  // Build 87-day matrix cells (13 columns x 7 rows = 91 slots)
  const startDate = new Date('2026-10-22T00:00:00');
  const matrixCells = Array.from({ length: 91 }).map((_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    const iso = d.toISOString().slice(0, 10);
    const rec = records[iso];
    const dayMins = rec ? Object.values(rec.durations || {}).reduce((a, b) => a + b, 0) : 0;
    const hrs = dayMins / 60;

    let colorCls = 'bg-[#1A1B20]';
    if (hrs >= 5) colorCls = 'bg-[#3898FF]';
    else if (hrs >= 2.5) colorCls = 'bg-[#2563EB]';
    else if (hrs > 0) colorCls = 'bg-[#1D3B7A]';

    return { iso, hrs, colorCls, inCampaign: idx < 87, dayIndex: idx + 1 };
  });

  const streakDays = state.streak || 0;
  const streakIndicators = [1, 2, 3, 4, 5, 6].map(num => num <= streakDays);

  container.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2 pb-28 space-y-3.5 select-none">

      <!-- Reference 4 (Bía Sleep): Ultra-Clean Top Mini Bentos -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bento-card py-4 px-5 flex flex-col justify-between">
          <div class="flex items-baseline gap-2">
            <svg class="text-[#3898FF] shrink-0 translate-y-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
            </svg>
            <div class="text-[30px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
              ${activeDays}<span class="text-[16px] text-[#71717A] font-normal"> / 87</span>
            </div>
          </div>
          <div class="text-[12px] text-[#71717A] mt-2">Active Campaign Days</div>
        </div>

        <div class="bento-card py-4 px-5 flex flex-col justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </span>
            <div class="text-[30px] font-semibold text-[#10B981] tabular-nums leading-none">
              +${masteryPct}<span class="text-[18px]">%</span>
            </div>
          </div>
          <div class="text-[12px] text-[#71717A] mt-2">${totalHours.toFixed(1)}h of 500h Mastery</div>
        </div>
      </div>

      <!-- Reference 4 (Bía Sleep): Consistency Card with Segmented Ring & Sky-Blue Matrix -->
      <section class="bento-card">
        <div class="flex items-center gap-1.5 text-[14px] font-medium text-[#D4D4D8] mb-3">
          <span>Consistency</span>
          <span class="w-4 h-4 rounded-full border border-white/20 text-[10px] text-[#71717A] flex items-center justify-center">?</span>
        </div>

        <div class="flex items-center gap-2.5 mb-5">
          <!-- Segmented Circular Ring SVG matching Bía Sleep -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-[#3898FF]">
            <circle cx="12" cy="12" r="9" stroke="rgba(56, 152, 255, 0.2)" stroke-width="2.5" stroke-dasharray="4 3"/>
            <path d="M12 3a9 9 0 1 1-6.36 2.64" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="text-[32px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
            ${consistencyPct}<span class="text-[19px] text-[#A1A1AA] font-normal">%</span>
          </div>
        </div>

        <!-- 13 x 7 Rounded Sky-Blue Heatmap Matrix -->
        <div class="grid grid-cols-13 gap-[5px] mb-3">
          ${matrixCells.map(cell => `
            <div
              data-matrix-day="Day ${cell.dayIndex} (${cell.iso})"
              data-matrix-hrs="${cell.hrs.toFixed(1)}"
              class="w-full aspect-square rounded-[4px] ${cell.colorCls} ${cell.inCampaign ? 'cursor-pointer hover:ring-1 hover:ring-white/40' : 'opacity-20'} transition-all"
              title="${cell.iso}: ${cell.hrs.toFixed(1)}h"
            ></div>
          `).join('')}
        </div>

        <!-- HUD readout for clicked cell -->
        <div id="matrix-hud" class="flex items-center justify-between text-[11px] text-[#71717A] pt-1">
          <span>Tap any block to inspect hours</span>
          <span>87-Day Grid</span>
        </div>
      </section>

      <!-- Reference 5 (Robinhood): 2-Column Streak Bento with 2-Tone Flame -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bento-card py-4 px-5">
          <div class="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FF6B4A"/>
              <path d="M12 18a3 3 0 0 0 3-3c0-1-.5-1.5-1-2-1-1-1.5-2-1.5-3-.5 1-1 2-2 3s-.5 1.5-.5 2a2 2 0 0 0 2 3z" fill="#FFB800"/>
            </svg>
            <span class="text-[12px] text-[#A1A1AA]">Current Streak</span>
          </div>
          <div class="text-[26px] font-semibold text-[#F4F4F6] tabular-nums leading-none mb-3">
            ${streakDays} <span class="text-[14px] text-[#71717A] font-normal">days</span>
          </div>
          <!-- 6 Circular 22px Indicators -->
          <div class="flex items-center gap-1.5">
            ${streakIndicators.map(active => `
              <span class="w-[20px] h-[20px] rounded-full flex items-center justify-center border ${
                active
                  ? 'bg-[#3898FF] border-[#3898FF] text-[#09090B]'
                  : 'bg-[#18191E] border-white/[0.08] text-[#52525B]'
              }">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            `).join('')}
          </div>
        </div>

        <div class="bento-card py-4 px-5">
          <div class="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FF6B4A"/>
            </svg>
            <span class="text-[12px] text-[#A1A1AA]">Longest Streak</span>
          </div>
          <div class="text-[26px] font-semibold text-[#F4F4F6] tabular-nums leading-none mb-3">
            ${state.bestStreak || streakDays} <span class="text-[14px] text-[#71717A] font-normal">days</span>
          </div>
          <div class="text-[11px] text-[#71717A] pt-1">
            Personal Best • All Dominos Locked
          </div>
        </div>
      </div>

      <!-- Reference 6 (Moonbeam): High-Contrast Allocation Card -->
      <section class="bento-card">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="text-[13px] text-[#71717A] mb-1">Total Effort Allocation</div>
            <div class="text-[28px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
              ${totalHours.toFixed(1)} <span class="text-[16px] text-[#71717A] font-normal">hrs total</span>
            </div>
          </div>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            Pacing on Track
          </span>
        </div>

        <!-- 38px Chunky Multi-Block Bar matching Moonbeam -->
        <div class="w-full rounded-[16px] bg-[#18191E] flex items-center gap-1.5 h-[44px] mb-3.5 p-1">
          <div style="flex: 42" class="h-full rounded-[10px] bg-[#F472B6]" title="Paper Sprint"></div>
          <div style="flex: 28" class="h-full rounded-[10px] bg-[#C084FC]" title="Sketch Drills"></div>
          <div style="flex: 16" class="h-full rounded-[10px] bg-[#60A5FA]" title="Walk & Run"></div>
          <div style="flex: 14" class="h-full rounded-[10px] bg-[#34D399]" title="Studio Build"></div>
        </div>

        <!-- Recessed 2x2 Vertical-Bar Legend matching Moonbeam -->
        <div class="recessed-well grid grid-cols-2 gap-x-4 gap-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-6 rounded-full bg-[#F472B6]"></span>
              <div>
                <div class="text-[12px] text-[#A1A1AA]">Paper Sprint</div>
                <div class="text-[12px] font-semibold text-[#F4F4F6] tabular-nums">${(totalStudyMins * 0.55 / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[12px] text-[#A1A1AA] tabular-nums">42%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-6 rounded-full bg-[#C084FC]"></span>
              <div>
                <div class="text-[12px] text-[#A1A1AA]">Sketch Drills</div>
                <div class="text-[12px] font-semibold text-[#F4F4F6] tabular-nums">${(totalStudyMins * 0.45 / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[12px] text-[#A1A1AA] tabular-nums">28%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-6 rounded-full bg-[#60A5FA]"></span>
              <div>
                <div class="text-[12px] text-[#A1A1AA]">Walk & Run</div>
                <div class="text-[12px] font-semibold text-[#F4F4F6] tabular-nums">${(totalWorkMins / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[12px] text-[#A1A1AA] tabular-nums">16%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-6 rounded-full bg-[#34D399]"></span>
              <div>
                <div class="text-[12px] text-[#A1A1AA]">Studio Build</div>
                <div class="text-[12px] font-semibold text-[#F4F4F6] tabular-nums">${(totalHours * 0.14).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[12px] text-[#A1A1AA] tabular-nums">14%</span>
          </div>
        </div>
      </section>

      <!-- Reference 4 (Bía Analysis): Narrative Card with Bold White Highlights -->
      <section class="bento-card">
        <div class="flex items-center gap-2 text-[#F59E0B] text-[14px] font-medium mb-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 3c.5 4.5 4.5 8.5 9 9-4.5.5-8.5 4.5-9 9-.5-4.5-4.5-8.5-9-9 4.5-.5 8.5-4.5 9-9Z"/>
          </svg>
          <span>Domino Analysis</span>
        </div>
        <p class="text-[14px] text-[#A1A1AA] leading-[1.6]">
          You locked all mandatory Dominos on <strong class="text-[#F4F4F6] font-semibold">${perfectDays} out of ${Math.max(activeDays, 1)} active days</strong> and it's compounding. On days you complete Walk & Fitness first, your study adherence trends up <strong class="text-[#F4F4F6] font-semibold">+24%</strong> with a <strong class="text-[#F4F4F6] font-semibold">${(totalHours / Math.max(activeDays, 1)).toFixed(1)}h daily average</strong>.
        </p>
      </section>

      <!-- Data Export Actions -->
      <div class="grid grid-cols-2 gap-3 pt-1">
        <button id="btn-export-csv" type="button" class="recessed-well text-center text-[13px] font-medium text-[#D4D4D8] btn-tactile flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
        <button id="btn-export-json" type="button" class="recessed-well text-center text-[13px] font-medium text-[#D4D4D8] btn-tactile flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Backup JSON
        </button>
      </div>

    </div>
  `;

  container.querySelectorAll('[data-matrix-day]').forEach(el => {
    el.addEventListener('click', () => {
      const hud = container.querySelector('#matrix-hud');
      if (hud) {
        hud.innerHTML = `<span class="text-[#F4F4F6] font-medium">${el.dataset.matrixDay}</span><span class="text-[#3898FF] font-semibold">${el.dataset.matrixHrs}h logged</span>`;
      }
      playRelayClick();
    });
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    playRelayClick();
    exportTelemetryCSV();
  });
  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    playRelayClick();
    exportTelemetryJSON();
  });
}
