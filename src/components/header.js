// src/components/header.js
import { getState, getCumulativeTelemetry } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
import { icons } from './icons.js';
import { getColorMode, toggleColorMode } from './theme-toggle.js';
import { playRelayClick } from '../utils/sound.js';

let isCountdownExpanded = false;
let countdownLiveTimer = null;
let toastLiveTimer = null;

export function showExamToast() {
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    document.body.appendChild(toast);
  }

  clearTimeout(toast._timeout);
  clearTimeout(toast._removeTimeout);
  if (toastLiveTimer) {
    clearInterval(toastLiveTimer);
    toastLiveTimer = null;
  }

  const dismiss = () => {
    if (toastLiveTimer) {
      clearInterval(toastLiveTimer);
      toastLiveTimer = null;
    }
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -12px)';
    toast.style.pointerEvents = 'none';
    clearTimeout(toast._removeTimeout);
    toast._removeTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 250);
  };

  const updateToastContent = () => {
    const cd = getExamCountdown();
    toast.innerHTML = `
      <div class="flex items-start justify-between gap-3 w-full">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <div>
            <div class="text-[11px] font-semibold tracking-wider text-[#A1A1AA] uppercase">CEED 2027 Examination</div>
            <div class="text-[13px] font-bold text-[#F4F4F6] mt-0.5">${cd.examDateFormatted} • 09:00 AM IST</div>
          </div>
        </div>
        <button id="toast-dismiss-btn" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-[#A1A1AA] hover:text-white flex items-center justify-center text-xs font-bold leading-none shrink-0" aria-label="Close">✕</button>
      </div>

      <div class="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
        <span class="text-[#71717A]">Exact Countdown</span>
        <span class="font-mono font-bold text-emerald-400 tabular-nums text-[12.5px]">${cd.days}d ${String(cd.hours).padStart(2, '0')}h ${String(cd.minutes).padStart(2, '0')}m ${String(cd.seconds).padStart(2, '0')}s</span>
      </div>

      <div class="mt-1 flex items-center justify-between text-[10px] text-[#71717A]">
        <span>Reporting: ${cd.reportingTimeFormatted}</span>
        <span>Duration: 3 Hours</span>
      </div>
    `;

    toast.querySelector('#toast-dismiss-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playRelayClick();
      dismiss();
    });
  };

  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 99999;
    padding: 14px 16px;
    font-family: var(--font-sans);
    border: 1px solid rgba(255, 255, 255, 0.14);
    background-color: #16171B;
    color: var(--text-primary);
    border-radius: 14px;
    width: calc(100vw - 32px);
    max-width: 360px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 1;
    pointer-events: auto;
  `;

  toast.style.display = 'flex';
  updateToastContent();
  toastLiveTimer = setInterval(updateToastContent, 1000);

  toast._timeout = setTimeout(dismiss, 6000);
}

export function showInAppToast(msg, isAlert = false) {
  if (!isAlert) return;
  let toast = document.getElementById('ceed-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ceed-toast';
    document.body.appendChild(toast);
  }

  clearTimeout(toast._timeout);
  clearTimeout(toast._removeTimeout);
  if (toastLiveTimer) {
    clearInterval(toastLiveTimer);
    toastLiveTimer = null;
  }

  toast.innerHTML = `
    <div style="flex: 1; padding-right: 8px;">${msg}</div>
    <button style="background: transparent; border: none; color: inherit; font-weight: bold; font-size: 13px; cursor: pointer; padding: 0 4px; line-height: 1;" aria-label="Dismiss">✕</button>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 99999;
    padding: 8px 16px;
    font-size: 12px;
    font-family: var(--font-sans);
    font-weight: 600;
    border: 1px solid var(--border-subtle);
    background-color: var(--surface-well);
    color: var(--text-primary);
    border-radius: 14px;
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
  const isLight = getColorMode() === 'light';
  const cleanRoute = (activeRoute || window.location.hash || '#/').split('?')[0];

  const tabs = [
    {
      hash: '#/',
      label: 'Today',
      isActive: cleanRoute === '#/' || cleanRoute === '' || cleanRoute === '#',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M8 15h2v2h-2z"/></svg>`
    },
    {
      hash: '#/stats',
      label: 'Stats',
      isActive: cleanRoute.startsWith('#/stats'),
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M20 18v-4"/><path d="M16 18v-8"/><path d="M12 18v-2"/><path d="M8 18v-5"/></svg>`
    },
    {
      hash: '#/studio',
      label: 'Studio',
      isActive: cleanRoute.startsWith('#/studio'),
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>`
    },
    {
      hash: '#/settings',
      label: 'Config',
      isActive: cleanRoute.startsWith('#/settings'),
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M18 4v1"/><path d="M18 9v11"/></svg>`
    }
  ];

  let headerEl = document.getElementById('topInstrumentHeader');
  if (!headerEl) {
    headerEl = document.createElement('header');
    headerEl.id = 'topInstrumentHeader';
    headerEl.className = 'sticky top-0 z-50 bg-[#000000]/90 dark:bg-black/90 backdrop-blur-md border-b border-white/[0.08] select-none';
    container.prepend(headerEl);
  }

  const pillLabel = isCountdownExpanded
    ? examCountdown.precise
    : `${examCountdown.compact} to CEED`;

  headerEl.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2.5 pb-2">
      <!-- Row 1: Telemetry, Countdown Pill, Sun/Moon Theme Toggle & Streak -->
      <div class="flex items-center justify-between mb-2">
        <!-- Left: Day of 87 + Interactive [XXd to CEED] Pill -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Day ${String(dayIndex + 1).padStart(2, '0')} <span class="text-[#71717A] font-normal">of 87</span>
          </span>
          <button
            id="btn-exam-countdown"
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#18181E] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#F4F4F6] border border-white/[0.08] transition-all cursor-pointer select-none active:scale-95"
            title="Tap for exact CEED exam timing & countdown"
            aria-label="Exam Countdown Details"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 ${isCountdownExpanded ? 'animate-pulse' : ''}"></span>
            <span id="countdown-pill-text" class="tabular-nums font-mono">${pillLabel}</span>
          </button>
        </div>

        <!-- Right: Sun/Moon Theme Toggle + Streak Pill (Shield Completely Removed) -->
        <div class="flex items-center gap-1.5">
          <!-- Night/Light Mode Toggle Button -->
          <button
            id="btn-color-mode-toggle"
            type="button"
            aria-label="Toggle Night/Light Mode"
            class="w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#18191E] border border-white/[0.08] text-[#A1A1AA] hover:text-[#F4F4F6] btn-tactile"
            title="${isLight ? 'Switch to Night Mode' : 'Switch to Light Mode'}"
          >
            ${isLight ? icons.moon(13) : icons.sun(13)}
          </button>

          <!-- Streak Pill with 2-Tone SVG Flame -->
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#18191E] border border-white/[0.08] text-[var(--text-primary)]">
            <span>${icons.flame(13)}</span>
            <span>${telemetry.streak}d</span>
          </div>
        </div>
      </div>

      <!-- Row 2: Sticky 4-Tab Navigation Bar (Today, Stats, Studio, Config) -->
      <nav class="grid grid-cols-4 gap-1 p-1 rounded-full bg-[#141418] border border-white/[0.07]" aria-label="Main Navigation">
        ${tabs.map(tab => `
          <a
            href="${tab.hash}"
            class="flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11.5px] transition-all btn-tactile ${
              tab.isActive
                ? 'bg-[#F4F4F6] text-[#09090B] font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F6] font-medium'
            }"
            aria-current="${tab.isActive ? 'page' : 'false'}"
          >
            ${tab.icon}
            <span>${tab.label}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;

  // Bind Exam Countdown Pill Click
  headerEl.querySelector('#btn-exam-countdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playRelayClick();

    isCountdownExpanded = !isCountdownExpanded;

    const pillText = headerEl.querySelector('#countdown-pill-text');
    if (countdownLiveTimer) {
      clearInterval(countdownLiveTimer);
      countdownLiveTimer = null;
    }

    if (isCountdownExpanded) {
      const updatePill = () => {
        const cd = getExamCountdown();
        if (pillText) pillText.textContent = cd.precise;
      };
      updatePill();
      countdownLiveTimer = setInterval(updatePill, 1000);
    } else {
      const cd = getExamCountdown();
      if (pillText) pillText.textContent = `${cd.compact} to CEED`;
    }

    // Trigger toast pop-up detailing exact exam schedule & time
    showExamToast();
  });

  // Bind Night/Light mode toggle
  headerEl.querySelector('#btn-color-mode-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleColorMode();
    renderHeader(container, activeRoute, currentDateStr);
  });

  // Bind nav tab click sounds
  headerEl.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      playRelayClick();
    });
  });
}
