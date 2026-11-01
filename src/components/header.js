// src/components/header.js
import { getState, getCumulativeTelemetry } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
import { icons } from './icons.js';

export function showInAppToast(msg, isAlert = false) {
  // Only display explicit critical alerts; silence routine feedback
  if (!isAlert) return;
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    document.body.appendChild(toast);
  }

  clearTimeout(toast._timeout);
  clearTimeout(toast._removeTimeout);

  toast.innerHTML = `
    <div style="flex: 1; padding-right: 8px;">${msg}</div>
    <button style="background: transparent; border: none; color: #F4F4F6; font-weight: bold; font-size: 13px; cursor: pointer; padding: 0 4px; line-height: 1;" aria-label="Dismiss">✕</button>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 9999;
    padding: 8px 16px;
    font-size: 12px;
    font-family: 'Geist Pixel Square', monospace;
    letter-spacing: -0.05em;
    font-weight: 600;
    border: 1px solid #27272A;
    background-color: #18181B;
    color: #F4F4F6;
    border-radius: 9999px;
    max-width: 90vw;
    display: flex;
    align-items: center;
    transition: opacity 0.2s ease, transform 0.2s ease;
    opacity: 1;
    pointer-events: auto;
    cursor: pointer;
  `;

  const dismiss = (e) => {
    if (e) e.stopPropagation();
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    toast.style.pointerEvents = 'none';
    clearTimeout(toast._removeTimeout);
    toast._removeTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 200);
  };

  toast.onclick = dismiss;
  toast._timeout = setTimeout(dismiss, 2800);
}

export function renderHeader(container, activeRoute = '#/', currentDateStr = null) {
  const state = getState();
  const telemetry = getCumulativeTelemetry();
  const todayStr = currentDateStr || new Date().toISOString().slice(0, 10);
  const dayIndex = getDayIndex(todayStr);
  const examCountdown = getExamCountdown();

  let headerEl = document.getElementById('topInstrumentHeader');
  if (!headerEl) {
    headerEl = document.createElement('header');
    headerEl.id = 'topInstrumentHeader';
    headerEl.className = 'sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-[#1F1F23] select-none';
    container.prepend(headerEl);
  }

  headerEl.innerHTML = `
    <div class="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
      <!-- Left: Day XX of 87 + inline highlight pill [76d to CEED] -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-[#F4F4F6] tracking-tight">
          Day ${String(dayIndex + 1).padStart(2, '0')} <span class="text-[#71717A] font-normal">of 87</span>
        </span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#18181B] text-[#A1A1AA] border border-[#27272A]">
          ${examCountdown.compact} to CEED
        </span>
      </div>

      <!-- Right: Streak Pill + Shield Badge (Using Tabler SVG Glyphs, Zero Raw Emojis) -->
      <div class="flex items-center gap-2">
        <!-- Shield Badge -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
          <span class="text-[#A1A1AA]">${icons.shield(13)}</span>
          <span class="text-[#F4F4F6] font-bold">${state.shields || 0}</span>
        </div>

        <!-- Streak Pill with 2-Tone SVG Flame -->
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#18181B] border border-[#27272A] text-[#F4F4F6]">
          <span>${icons.flame(14)}</span>
          <span>${telemetry.streak}d</span>
        </div>
      </div>
    </div>
  `;
}
