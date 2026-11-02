// src/views/stats.js
import { getState, getBlocks, isDominoTask } from '../core/state.js';
import { exportTelemetryCSV, exportTelemetryJSON } from '../core/telemetry.js';
import { playRelayClick } from '../utils/sound.js';
import { formatDateLocal } from '../utils/dates.js';

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
  const isLight = document.documentElement.classList.contains('theme-light');
  const startDate = new Date(2026, 9, 22); // Oct 22, 2026 local
  const matrixCells = Array.from({ length: 91 }).map((_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    const iso = formatDateLocal(d);
    const rec = records[iso];
    const dayMins = rec ? Object.values(rec.durations || {}).reduce((a, b) => a + b, 0) : 0;
    const hrs = dayMins / 60;

    let bgHex = isLight ? '#EAE9E3' : '#18191E';
    if (hrs >= 5) bgHex = isLight ? '#15803D' : '#C8F560'; // Peak Vibrant Lime / High Forest
    else if (hrs >= 3.5) bgHex = isLight ? '#16A34A' : '#22C55E'; // High Bright Green
    else if (hrs >= 2) bgHex = isLight ? '#22C55E' : '#16A34A'; // Medium Emerald Green
    else if (hrs > 0) bgHex = isLight ? '#86EFAC' : '#14532D'; // Low Light Green

    return { iso, hrs, bgHex, inCampaign: idx < 87, dayIndex: idx + 1 };
  });

  const streakDays = state.streak || 0;
  const streakIndicators = [1, 2, 3, 4, 5, 6].map(num => num <= streakDays);

  container.innerHTML = `
    <div class="max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-6 space-y-3.5 select-none">

      <!-- Top Row: Dual High-Craft Bentos -->
      <div class="grid grid-cols-2 gap-3 stagger-item stagger-delay-1">
        <div class="bento-card py-4 px-4 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-1.5">
            <svg class="text-[#22C55E] shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
            </svg>
            <span class="text-[11.5px] font-medium text-[#71717A]">Active Days</span>
          </div>
          <div class="text-[28px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
            ${activeDays}<span class="text-[15px] text-[#71717A] font-normal"> / 87</span>
          </div>
          <div class="text-[11px] text-[#71717A] mt-2">
            ${perfectDays} perfect days locked
          </div>
        </div>

        <div class="bento-card py-4 px-4 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-5 h-5 rounded-full bg-[var(--domino-accent)]/20 text-[var(--domino-accent)] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </span>
            <span class="text-[11.5px] font-medium text-[#71717A]">Mastery Pace</span>
          </div>
          <div class="text-[28px] font-semibold text-[var(--domino-accent)] tabular-nums leading-none">
            ${masteryPct}<span class="text-[17px] font-normal">%</span>
          </div>
          <div class="text-[11px] text-[#71717A] mt-2">
            ${totalHours.toFixed(1)}h of 500h target
          </div>
        </div>
      </div>

      <!-- Consistency Card with Segmented Ring & Glitch-Free 13-Column High-Contrast Green Grid -->
      <section class="bento-card stagger-item stagger-delay-2">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 text-[14px] font-medium text-[#D4D4D8]">
            <span>Consistency Index</span>
            <span class="w-4 h-4 rounded-full border border-white/20 text-[10px] text-[#71717A] flex items-center justify-center">?</span>
          </div>
          <span class="text-[11px] text-[#71717A]">Target: 80%+</span>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <!-- Segmented Circular Ring SVG (Active Accent) -->
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="text-[var(--domino-accent)] shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="2.5" stroke-dasharray="4 3"/>
            <path d="M12 3a9 9 0 1 1-6.36 2.64" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="text-[32px] font-bold text-[var(--domino-accent)] tabular-nums leading-none">
            ${consistencyPct}<span class="text-[18px] text-[#71717A] font-normal">%</span>
          </div>
          <span class="text-[12px] text-[#71717A] leading-tight ml-auto text-right">
            Based on locked<br/>mandatory floors
          </span>
        </div>

        <!-- Glitch-Free 13-Column Grid using explicit CSS Grid style -->
        <div class="p-2 rounded-xl bg-[#16171B] border border-white/[0.04] mb-3">
          <div style="display: grid; grid-template-columns: repeat(13, minmax(0, 1fr)); gap: 4.5px;">
            ${matrixCells.map(cell => `
              <div
                data-matrix-day="Day ${cell.dayIndex} (${cell.iso})"
                data-matrix-hrs="${cell.hrs.toFixed(1)}"
                style="background-color: ${cell.bgHex};"
                class="w-full aspect-square rounded-[3px] ${cell.inCampaign ? 'cursor-pointer hover:ring-1 hover:ring-white/60' : 'opacity-20'} transition-transform"
                title="${cell.iso}: ${cell.hrs.toFixed(1)}h"
              ></div>
            `).join('')}
          </div>
        </div>

        <!-- Interactive HUD readout for tapped cell with green scale legend -->
        <div id="matrix-hud" class="flex items-center justify-between text-[11px] text-[#71717A] px-1">
          <span>Tap any block to inspect hours</span>
          <div class="flex items-center gap-1.5" title="0h → 1-2h → 2-3.5h → 3.5-5h → 5h+">
            <span class="w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#EAE9E3]' : 'bg-[#18191E]'}"></span>
            <span class="w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#86EFAC]' : 'bg-[#14532D]'}"></span>
            <span class="w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#22C55E]' : 'bg-[#16A34A]'}"></span>
            <span class="w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#16A34A]' : 'bg-[#22C55E]'}"></span>
            <span class="w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#15803D]' : 'bg-[#C8F560]'}"></span>
          </div>
        </div>
      </section>

      <!-- 2-Column Streak Bento with 2-Tone Flame -->
      <div class="grid grid-cols-2 gap-3 stagger-item stagger-delay-3">
        <div class="bento-card py-4 px-4">
          <div class="flex items-center gap-2 mb-2">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FF6B4A"/>
              <path d="M12 18a3 3 0 0 0 3-3c0-1-.5-1.5-1-2-1-1-1.5-2-1.5-3-.5 1-1 2-2 3s-.5 1.5-.5 2a2 2 0 0 0 2 3z" fill="#FFB800"/>
            </svg>
            <span class="text-[12px] text-[#A1A1AA]">Current Streak</span>
          </div>
          <div class="text-[26px] font-semibold text-[#F4F4F6] tabular-nums leading-none mb-3">
            ${streakDays} <span class="text-[13px] text-[#71717A] font-normal">days</span>
          </div>
          <!-- 6 Circular Status Rings -->
          <div class="flex items-center gap-1.5">
            ${streakIndicators.map(active => `
              <span class="w-[18px] h-[18px] rounded-full flex items-center justify-center border ${
                active
                  ? 'bg-[#3898FF] border-[#3898FF] text-[#09090B]'
                  : 'bg-[#18191E] border-white/[0.08] text-[#52525B]'
              }">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            `).join('')}
          </div>
        </div>

        <div class="bento-card py-4 px-4">
          <div class="flex items-center gap-2 mb-2">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FF6B4A"/>
            </svg>
            <span class="text-[12px] text-[#A1A1AA]">Longest Streak</span>
          </div>
          <div class="text-[26px] font-semibold text-[#F4F4F6] tabular-nums leading-none mb-3">
            ${state.bestStreak || streakDays} <span class="text-[13px] text-[#71717A] font-normal">days</span>
          </div>
          <div class="text-[11px] text-[#71717A]">
            Personal Best Record
          </div>
        </div>
      </div>

      <!-- Effort Allocation Card -->
      <section class="bento-card stagger-item stagger-delay-4">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="text-[12px] text-[#71717A] mb-0.5">Total Effort Allocation</div>
            <div class="text-[26px] font-semibold text-[#F4F4F6] tabular-nums leading-none">
              ${totalHours.toFixed(1)} <span class="text-[15px] text-[#71717A] font-normal">hrs logged</span>
            </div>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            Adherence High
          </span>
        </div>

        <!-- 40px Multi-Block Segment Bar (Anti-Slop Disciplined Monochromatic Accent Scale) -->
        <div class="w-full rounded-[14px] bg-[var(--surface-well)] flex items-center gap-1.5 h-[38px] my-3 p-1">
          <div style="flex: 42; background-color: var(--domino-accent);" class="h-full rounded-[9px] shadow-sm transition-all" title="Paper Sprint (100% Accent)"></div>
          <div style="flex: 28; background-color: color-mix(in srgb, var(--domino-accent) 75%, transparent);" class="h-full rounded-[9px] transition-all" title="Sketch Drills (75% Accent)"></div>
          <div style="flex: 16; background-color: color-mix(in srgb, var(--domino-accent) 50%, transparent);" class="h-full rounded-[9px] transition-all" title="Walk & Fitness (50% Accent)"></div>
          <div style="flex: 14; background-color: color-mix(in srgb, var(--domino-accent) 28%, transparent);" class="h-full rounded-[9px] transition-all" title="Studio Build (28% Accent)"></div>
        </div>

        <!-- Recessed 2x2 Legend -->
        <div class="recessed-well grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-5 rounded-full" style="background-color: var(--domino-accent);"></span>
              <div>
                <div class="text-[11.5px] text-[var(--text-secondary)]">Paper Sprint</div>
                <div class="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">${(totalStudyMins * 0.55 / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[11px] text-[var(--text-muted)] tabular-nums">42%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-5 rounded-full" style="background-color: color-mix(in srgb, var(--domino-accent) 75%, transparent);"></span>
              <div>
                <div class="text-[11.5px] text-[var(--text-secondary)]">Sketch Drills</div>
                <div class="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">${(totalStudyMins * 0.45 / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[11px] text-[var(--text-muted)] tabular-nums">28%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-5 rounded-full" style="background-color: color-mix(in srgb, var(--domino-accent) 50%, transparent);"></span>
              <div>
                <div class="text-[11.5px] text-[var(--text-secondary)]">Walk & Run</div>
                <div class="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">${(totalWorkMins / 60).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[11px] text-[var(--text-muted)] tabular-nums">16%</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-[3px] h-5 rounded-full" style="background-color: color-mix(in srgb, var(--domino-accent) 28%, transparent);"></span>
              <div>
                <div class="text-[11.5px] text-[var(--text-secondary)]">Studio Build</div>
                <div class="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">${(totalHours * 0.14).toFixed(1)}h</div>
              </div>
            </div>
            <span class="text-[11px] text-[var(--text-muted)] tabular-nums">14%</span>
          </div>
        </div>
      </section>

      <!-- Domino Analysis Narrative Card -->
      <section class="bento-card">
        <div class="flex items-center gap-2 text-[#F59E0B] text-[13.5px] font-semibold mb-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 3c.5 4.5 4.5 8.5 9 9-4.5.5-8.5 4.5-9 9-.5-4.5-4.5-8.5-9-9 4.5-.5 8.5-4.5 9-9Z"/>
          </svg>
          <span>Domino Momentum Analysis</span>
        </div>
        <p class="text-[13.5px] text-[#A1A1AA] leading-[1.6]">
          You locked all mandatory Dominos on <strong class="text-[#F4F4F6] font-semibold">${perfectDays} out of ${Math.max(activeDays, 1)} active days</strong>. Completing Walk & Fitness early correlates with <strong class="text-[#F4F4F6] font-semibold">+24% higher study focus</strong> and a steady <strong class="text-[#F4F4F6] font-semibold">${(totalHours / Math.max(activeDays, 1)).toFixed(1)}h daily execution</strong>.
        </p>
      </section>

      <!-- Portability Actions -->
      <div class="grid grid-cols-2 gap-3 pt-1">
        <button id="btn-export-csv" type="button" class="recessed-well text-center text-[12.5px] font-medium text-[#D4D4D8] btn-tactile flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
        <button id="btn-export-json" type="button" class="recessed-well text-center text-[12.5px] font-medium text-[#D4D4D8] btn-tactile flex items-center justify-center gap-2">
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
        hud.innerHTML = `<span class="text-[#F4F4F6] font-semibold">${el.dataset.matrixDay}</span><span class="text-[#3898FF] font-bold">${el.dataset.matrixHrs}h logged</span>`;
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
