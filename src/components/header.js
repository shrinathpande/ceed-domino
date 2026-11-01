// src/components/header.js
import { getState, getCumulativeTelemetry, getAccentColor } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';

export function showInAppToast(msg, isAlert = false) {
  // Silence noisy routine toasts; only display critical or explicit alert toasts
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
    <button style="background: transparent; border: none; color: #ffffff; font-weight: bold; font-size: 13px; cursor: pointer; padding: 0 4px; line-height: 1;" aria-label="Dismiss">✕</button>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 9999;
    padding: 8px 16px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: rgba(18, 18, 21, 0.95);
    backdrop-filter: blur(12px);
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
    border-radius: 9999px;
    max-width: 90vw;
    display: flex;
    align-items: center;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
    }, 250);
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
  const accentColor = getAccentColor();

  let headerEl = document.getElementById('topInstrumentHeader');
  if (!headerEl) {
    headerEl = document.createElement('header');
    headerEl.id = 'topInstrumentHeader';
    headerEl.className = 'sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-white/[0.06] select-none';
    container.prepend(headerEl);
  }

  headerEl.innerHTML = `
    <div class="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
      <!-- Left: Day XX of 87 + inline highlight pill [76d to CEED] -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-white tracking-tight">
          Day ${String(dayIndex + 1).padStart(2, '0')} <span class="text-zinc-500 font-normal">of 87</span>
        </span>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.08] text-zinc-300 border border-white/10">
          ${examCountdown.compact} to CEED
        </span>
      </div>

      <!-- Right: Streak Pill + Shield Badge -->
      <div class="flex items-center gap-1.5">
        <!-- Shield Badge -->
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1A1A1F] border border-white/10 text-zinc-300">
          <span>🛡️</span>
          <span class="text-white font-bold">${state.shields || 0}</span>
        </div>

        <!-- Streak Pill -->
        <div
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style="background-color: ${accentColor}22; border: 1px solid ${accentColor}55; color: ${accentColor};"
        >
          <span>🔥</span>
          <span>${telemetry.streak}d</span>
        </div>
      </div>
    </div>
  `;
}
