// src/components/header.js
import { getState, getCumulativeTelemetry, getTheme, cycleTheme, THEMES, getAccentColor } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
import { playRelayClick } from '../utils/sound.js';

export function showInAppToast(msg, isAlert = false) {
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    document.body.appendChild(toast);
  }

  // Clear existing dismissal timers
  clearTimeout(toast._timeout);
  clearTimeout(toast._removeTimeout);

  const accentColor = getAccentColor();
  const borderCol = isAlert ? accentColor : '#ffffff';
  const textCol = isAlert ? accentColor : '#ffffff';

  toast.innerHTML = `
    <div style="flex: 1; padding-right: 8px;">${msg}</div>
    <button style="background: transparent; border: none; color: ${textCol}; font-weight: bold; font-size: 13px; cursor: pointer; padding: 0 4px; line-height: 1;" aria-label="Dismiss">✕</button>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 56px;
    left: 50%;
    transform: translate(-50%, 0) scale(1);
    z-index: 9999;
    padding: 8px 14px;
    font-size: 11px;
    font-family: "Geist Mono", monospace;
    font-weight: 700;
    border: 2px solid ${borderCol};
    background-color: #000000;
    color: ${textCol};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    max-width: 92vw;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 1;
    pointer-events: auto;
    cursor: pointer;
  `;

  const dismiss = (e) => {
    if (e) e.stopPropagation();
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px) scale(0.95)';
    toast.style.pointerEvents = 'none';
    clearTimeout(toast._removeTimeout);
    toast._removeTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 250);
  };

  toast.onclick = dismiss;

  // Auto-dismiss after 2.8 seconds
  toast._timeout = setTimeout(dismiss, 2800);
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
          class="flex items-center gap-1 px-2 py-0.5 bg-[#0a0a0a] border border-neutral-700 text-white rounded-full text-[10px] font-bold active:scale-95 transition-all"
          title="${examCountdown.detailed}"
        >
          <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background-color: ${getAccentColor()};"></span>
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

          <div class="flex items-center gap-0.5 px-1.5 py-0.5 text-black rounded font-bold text-[10px]" style="background-color: ${getAccentColor()};">
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

  // Bind Header Controls: Tapping countdown button toggles details toast
  headerEl.querySelector('#btn-header-countdown')?.addEventListener('click', () => {
    playRelayClick();
    const toast = document.getElementById('ceed-toast');
    if (toast && toast.style.display !== 'none' && toast.style.opacity === '1') {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px) scale(0.95)';
      setTimeout(() => { toast.style.display = 'none'; }, 250);
    } else {
      showInAppToast(examCountdown.detailed);
    }
  });

  headerEl.querySelector('#btn-header-theme')?.addEventListener('click', () => {
    const next = cycleTheme();
    const nextTheme = THEMES.find(t => t.id === next);
    showInAppToast(`Theme: ${nextTheme ? nextTheme.name : next}`);
    renderHeader(container, activeRoute, currentDateStr);
  });
}
