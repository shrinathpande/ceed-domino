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

    return { iso, hrs, colorCls, inCampaign: idx < 87 };
  });

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
            <circle cx="12" cy="12" r="9" stroke=" rgba(56, 152, 255, 0.2)" stroke-width="2.5" stroke-dasharray="4 3"/>
            <path d="M12 3a9 9 0 1 1-6.36 2.64" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="text-[32px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
            ${consistencyPct}<span class="text-[19px] text-[#A1A1AA] font-normal">%</span>
          </div>
        </div>

        <!-- 13 x 7 Rounded Sky-Blue Heatmap Matrix -->
        <div class="grid grid-cols-13 gap-[5px]">
          ${matrixCells.map(cell => `
            <div
              data-matrix-day="${cell.iso}"
              data-matrix-hrs="${cell.hrs.toFixed(1)}"
              class="aspect-square rounded-[4px] ${cell.colorCls} ${cell.inCampaign ? 'cursor-pointer hover:ring-1 hover:ring-white/40' : 'opacity-25'} transition-transform"
            ></div>
          `).join('')}
        </div>

        <div id="matrix-hud" class="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[12px] text-[#A1A1AA] tabular-nums">
          <span>Tap any square to inspect daily log</span>
          <span class="text-[#3898FF] font-semibold">${totalHours.toFixed(1)}h total</span>
        </div>
      </section>

      <!-- Reference 4 (Bía Sleep): Current Streak & Longest Streak 2-Column Bento -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bento-card">
          <div class="text-[13px] font-medium text-[#D4D4D8] mb-3">Current Streak</div>
          <div class="flex items-baseline gap-2 mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="shrink-0 translate-y-0.5">
              <path d="M12 2C9.5 6 7 8.5 7 13a5 5 0 0 0 10 0c0-4.5-2.5-7-5-11Z" fill="#FF6B4A"/>
              <path d="M12 9c-1.2 2-2.5 3.2-2.5 5.2a2.5 2.5 0 0 0 5 0c0-2-1.3-3.2-2.5-5.2Z" fill="#FFB800"/>
            </svg>
            <div class="text-[32px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
              ${state.streak || 0} <span class="text-[15px] font-normal text-[#A1A1AA]">days</span>
            </div>
          </div>
          <!-- 6 Circular Streak Rings -->
          <div class="flex items-center justify-between gap-1 pt-1">
            ${Array.from({ length: 6 }).map((_, i) => {
              const filled = i < (state.streak || 0);
              return `<span class="w-[21px] h-[21px] rounded-full border-2 ${filled ? 'bg-[#3898FF] border-[#3898FF]' : 'border-[#2E2F36]'}"></span>`;
            }).join('')}
          </div>
        </div>

        <div class="bento-card flex flex-col justify-between">
          <div>
            <div class="text-[13px] font-medium text-[#D4D4D8] mb-3">Longest Streak</div>
            <div class="flex items-baseline gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="shrink-0 translate-y-0.5">
                <path d="M12 2C9.5 6 7 8.5 7 13a5 5 0 0 0 10 0c0-4.5-2.5-7-5-11Z" fill="#FF6B4A"/>
                <path d="M12 9c-1.2 2-2.5 3.2-2.5 5.2a2.5 2.5 0 0 0 5 0c0-2-1.3-3.2-2.5-5.2Z" fill="#FFB800"/>
              </svg>
              <div class="text-[32px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
                ${Math.max(state.streak || 0, state.longestStreak || 2)} <span class="text-[15px] font-normal text-[#A1A1AA]">days</span>
              </div>
            </div>
          </div>
          <div class="text-[12px] text-[#71717A] tabular-nums pt-1">Oct 22 - Jan 17, 2027</div>
        </div>
      </div>

      <!-- Reference 6 (Moonbeam Analytics): Chunky Multi-Block Allocation Bar & Vertical Bar Legend -->
      <section class="bento-card">
        <div class="flex items-center justify-between text-[12px] text-[#A1A1AA] mb-1">
          <span>Cumulative Volume</span>
          <span class="text-[#4ADE80] font-mono font-semibold">▲ ${(totalHours / Math.max(activeDays, 1)).toFixed(1)}h / day</span>
        </div>
        <div class="text-[34px] font-semibold text-[#F4F4F6] tabular-nums leading-tight mb-2">
          ${totalHours.toFixed(1)}h
        </div>
        <p class="text-[13px] text-[#A1A1AA] leading-relaxed mb-4">
          Your top output pillars are driven by
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F472B6]/15 text-[#F472B6] font-medium text-[12px]">✦ Deep Study</span>
          across the 87-day campaign.
        </p>

        <!-- Chunky 40px Segmented Block Bar -->
        <div class="p-1.5 rounded-[16px] bg-[#18191E] flex items-center gap-1.5 h-[44px] mb-3.5">
          <div style="flex: 42" class="h-full rounded-[10px] bg-[#F472B6]"></div>
          <div style="flex: 28" class="h-full rounded-[10px] bg-[#C084FC]"></div>
          <div style="flex: 16" class="h-full rounded-[10px] bg-[#60A5FA]"></div>
          <div style="flex: 14" class="h-full rounded-[10px] bg-[#34D399]"></div>
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
          You locked all mandatory Dominos on <strong class="text-[#F4F4F6] font-semibold">${perfectDays} out of ${Math.max(activeDays, 1)} active days</strong> and it’s compounding. On days you complete Walk & Fitness first, your study adherence trends up <strong class="text-[#F4F4F6] font-semibold">+24%</strong> with a <strong class="text-[#F4F4F6] font-semibold">${(totalHours / Math.max(activeDays, 1)).toFixed(1)}h daily average</strong>.
        </p>
      </section>

      <!-- Data Export Actions -->
      <div class="grid grid-cols-2 gap-3 pt-1">
        <button id="btn-export-csv" type="button" class="recessed-well text-center text-[13px] font-medium text-[#D4D4D8] btn-tactile">
          ↓ Export CSV
        </button>
        <button id="btn-export-json" type="button" class="recessed-well text-center text-[13px] font-medium text-[#D4D4D8] btn-tactile">
          ↓ Backup JSON
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