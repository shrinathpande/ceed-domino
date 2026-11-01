// src/components/header.js
import { getState, getCumulativeTelemetry, getTheme, cycleTheme, THEMES } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
import { playRelayClick } from '../utils/sound.js';

export function showInAppToast(msg, isAlert = false) {
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  const alertStyles = isAlert
    ? 'border-[#FF69AF] bg-black text-[#FF69AF]'
    : 'border-white bg-black text-white';
  toast.className = `fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs font-mono font-bold tracking-tight border-2 ${alertStyles} shadow-2xl transition-all duration-300 pointer-events-none select-none max-w-[92vw] text-center opacity-100 scale-100 rounded-lg`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.className += ' opacity-0 scale-95';
  }, 3200);
}

export function renderHeader(container, activeRoute = '#/', currentDateStr = null) {
  const state = getState();
  const telemetry = getCumulativeTelemetry();
  const todayStr = currentDateStr || new Date().toISOString().slice(0, 10);
  const dayIndex = getDayIndex(todayStr);
  const examCountdown = getExamCountdown();
  const currentThemeId = getTheme();
  const currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
  const cleanRoute = (activeRoute || window.location.hash || '#/').split('?')[0];

  const routes = [
    { hash: '#/', label: 'TODAY' },
    { hash: '#/stats', label: 'STATS' },
    { hash: '#/studio', label: 'STUDIO' },
    { hash: '#/settings', label: 'CONFIG' }
  ];

  let headerEl = document.getElementById('topInstrumentHeader');
  if (!headerEl) {
    headerEl = document.createElement('header');
    headerEl.id = 'topInstrumentHeader';
    headerEl.className = 'sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-800 font-mono transition-colors';
    container.prepend(headerEl);
  }

  headerEl.innerHTML = `
    <div class="max-w-[420px] mx-auto px-2.5 pt-2 pb-1.5 flex flex-col gap-1.5 select-none">
      <!-- ROW 1: System Stamp, Day, Exam Countdown Pill, Theme Toggle, Shields, Streak -->
      <div class="flex items-center justify-between gap-1 text-[11px]">
        <!-- Left: Stamp + Day + Level -->
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="w-5 h-5 bg-white text-black font-extrabold flex items-center justify-center rounded-[3px] text-[10px]">
            C87
          </span>
          <span class="font-bold text-white text-[11px]">
            D${String(dayIndex + 1).padStart(2, '0')}
          </span>
          <span class="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded-[2px]">
            L${telemetry.level}
          </span>
        </div>

        <!-- Center: Jan 17 Countdown Pill -->
        <button
          id="btn-header-countdown"
          class="flex items-center gap-1 px-2 py-0.5 bg-[#0a0a0a] border border-neutral-700 hover:border-[#FF69AF] text-white rounded-full text-[10px] font-bold active:scale-95 transition-all"
          title="${examCountdown.detailed}"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#FF69AF] animate-pulse"></span>
          <span>${examCountdown.compact}</span>
        </button>

        <!-- Right: Theme Switcher & Streak Counter -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            id="btn-header-theme"
            class="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white rounded text-[10px] font-bold active:scale-95 transition-all"
            title="Cycle Theme: Cyber, Brutalist, Stealth"
          >
            ${currentTheme.label}
          </button>

          <div class="flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300">
            <span>🛡️</span>
            <span class="font-bold text-white">${state.shields || 0}</span>
          </div>

          <div class="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FF69AF] text-black rounded font-bold text-[10px]">
            <span>🔥</span>
            <span>${telemetry.streak}D</span>
          </div>
        </div>
      </div>

      <!-- ROW 2: View Switcher Tabs with Gesture Indicator -->
      <div class="grid grid-cols-4 gap-1 pt-0.5" role="tablist">
        ${routes.map(r => {
          const isActive = cleanRoute === r.hash || (r.hash === '#/' && (cleanRoute === '' || cleanRoute === '#'));
          return `
            <a
              href="${r.hash}"
              class="h-7 flex items-center justify-center text-[10px] font-bold tracking-wider uppercase transition-all rounded ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#0c0c0c] text-neutral-400 hover:text-white border border-neutral-800'
              }"
              role="tab"
              aria-selected="${isActive}"
            >
              ${r.label}
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Bind Header Controls
  headerEl.querySelector('#btn-header-countdown')?.addEventListener('click', () => {
    playRelayClick();
    showInAppToast(examCountdown.detailed);
  });

  headerEl.querySelector('#btn-header-theme')?.addEventListener('click', () => {
    const next = cycleTheme();
    const nextTheme = THEMES.find(t => t.id === next);
    showInAppToast(`Theme: ${nextTheme ? nextTheme.name : next}`);
    renderHeader(container, activeRoute, currentDateStr);
  });
}
