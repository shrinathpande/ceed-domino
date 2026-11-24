// src/components/header.js
import { getState, getCumulativeTelemetry, getTimelineMode, setTimelineMode } from '../core/state.js';
import { getDayIndex, getTotalDays, getExamCountdown } from '../utils/dates.js';
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
    toast.style.transform = 'translate(-50%, -12px) scale(0.96)';
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
            <div class="text-[12px] font-semibold text-[#A1A1AA]">CEED 2027 Examination</div>
            <div class="text-[13px] font-bold text-[#F4F4F6] mt-0.5">${cd.examDateFormatted} • 09:00 AM IST</div>
          </div>
        </div>
        <button id="toast-dismiss-btn" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-[#A1A1AA] hover:text-white flex items-center justify-center shrink-0" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
        <span class="text-[var(--text-muted)]">Exact Countdown</span>
        <span class="font-mono font-bold text-emerald-400 tabular-nums text-[12.5px]">${cd.days}d ${String(cd.hours).padStart(2, '0')}h ${String(cd.minutes).padStart(2, '0')}m ${String(cd.seconds).padStart(2, '0')}s</span>
      </div>

      <div class="mt-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
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
    top: max(20px, calc(env(safe-area-inset-top, 0px) + 10px));
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 99999;
    padding: 14px 16px;
    font-family: var(--font-sans);
    border: 1px solid var(--border-subtle);
    background-color: var(--surface-card);
    color: var(--text-primary);
    border-radius: 14px;
    width: calc(100vw - 32px);
    max-width: 360px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
    transform: translate(-50%, -12px) scale(0.96);
    pointer-events: auto;
  `;

  toast.style.display = 'flex';
  updateToastContent();
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0) scale(1)';
  });
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
    <button style="background: transparent; border: none; color: inherit; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0 4px;" aria-label="Dismiss">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
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
  const totalDays = getTotalDays();
  const timelineMode = getTimelineMode();
  const isMitra = timelineMode === 'mitra54';
  const examCountdown = getExamCountdown();
  const isLight = getColorMode() === 'light';
  const cleanRoute = (activeRoute || window.location.hash || '#/').split('?')[0];

  const tabs = [
    {
      hash: '#/',
      label: 'Today',
      isActive: cleanRoute === '#/' || cleanRoute === '' || cleanRoute === '#',
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M8 15h2v2h-2z"/></svg>`
    },
    {
      hash: '#/goal',
      label: 'Goal',
      badge: 'AIR 1',
      isActive: cleanRoute.startsWith('#/goal'),
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      hash: '#/stats',
      label: 'Stats',
      isActive: cleanRoute.startsWith('#/stats'),
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M20 18v-4"/><path d="M16 18v-8"/><path d="M12 18v-2"/><path d="M8 18v-5"/></svg>`
    },
    {
      hash: '#/studio',
      label: 'Studio',
      isActive: cleanRoute.startsWith('#/studio'),
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>`
    },
    {
      hash: '#/settings',
      label: 'Config',
      isActive: cleanRoute.startsWith('#/settings'),
      icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M18 4v1"/><path d="M18 9v11"/></svg>`
    }
  ];

  let headerEl = document.getElementById('topInstrumentHeader');
  if (!headerEl) {
    headerEl = document.createElement('header');
    headerEl.id = 'topInstrumentHeader';
    headerEl.className = 'sticky top-0 z-40 bg-[var(--bg-canvas)]/92 backdrop-blur-xl border-b border-[var(--border-subtle)] select-none pt-[env(safe-area-inset-top,10px)] transition-colors duration-200';
    container.prepend(headerEl);
  }

  const pillLabel = isCountdownExpanded
    ? examCountdown.precise
    : `${examCountdown.compact} to CEED`;

  headerEl.innerHTML = `
    <div class="max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-2 stagger-item stagger-delay-0">
      <!-- Unified iOS Navigation Bar Row -->
      <div class="flex items-center justify-between gap-2">
        <!-- Left: Day XX of YY + Timeline Switcher -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <span class="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
            Day <span class="font-extrabold text-[var(--domino-accent)]">${String(dayIndex + 1).padStart(2, '0')}</span> <span class="text-[var(--text-secondary)] font-normal text-xs sm:text-sm">of ${totalDays}</span>
          </span>
          <button
            id="btn-timeline-toggle"
            type="button"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border transition-all cursor-pointer select-none ios-spring ${
              isMitra
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 hover:bg-[#F59E0B]/25'
                : 'bg-[var(--surface-well)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }"
            title="Toggle between 54-Day MITRA AIR 1 Sprint and 87-Day Legacy Campaign"
            aria-label="Toggle timeline mode"
          >
            ${isMitra ? 'MITRA 54' : 'CEED 87'}
          </button>
        </div>

        <!-- Right: Countdown Pill + Sun/Moon Toggle + Streak Pill -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-exam-countdown"
            type="button"
            class="inline-flex items-center px-2.5 py-1 min-h-[30px] rounded-full text-[10.5px] sm:text-[11px] font-medium bg-[var(--surface-well)] hover:opacity-90 text-[var(--text-secondary)] hover:text-[var(--domino-accent)] border border-[var(--border-subtle)] hover:border-[var(--domino-accent)]/40 transition-all cursor-pointer select-none ios-spring"
            title="Tap for exact CEED exam timing & live countdown"
            aria-label="Toggle exact countdown to CEED exam"
          >
            <span id="countdown-pill-text" class="tabular-nums font-mono">${pillLabel}</span>
          </button>

          <!-- Sun/Moon Mode Toggle Button -->
          <button
            id="btn-color-mode-toggle"
            type="button"
            aria-label="Toggle between Light and Night display modes"
            class="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer ios-spring"
            title="${isLight ? 'Switch to Night Mode' : 'Switch to Light Mode'}"
          >
            ${isLight ? icons.moon(13) : icons.sun(13)}
          </button>

          <!-- Streak Pill with Flame -->
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
            <span>${icons.flame(12)}</span>
            <span>${telemetry.streak}d</span>
          </div>
        </div>
      </div>

      <!-- Desktop-Only Nav (On Mobile, iOS Bottom Tab Bar handles navigation) -->
      <nav class="hidden md:grid grid-cols-5 gap-1 p-1 mt-2 rounded-full bg-[var(--surface-well)] border border-[var(--border-subtle)]" aria-label="Desktop Navigation">
        ${tabs.map(tab => `
          <a
            href="${tab.hash}"
            class="flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-full text-[12px] transition-all ${
              tab.isActive
                ? 'bg-[var(--domino-accent)] text-[#09090B] font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
            }"
            aria-current="${tab.isActive ? 'page' : 'false'}"
          >
            ${tab.icon}
            <span class="truncate">${tab.label}</span>
            ${tab.badge ? `
              <span class="inline-flex items-center px-1 py-0.2 rounded text-[8px] font-mono font-black uppercase leading-none ${
                tab.isActive
                  ? 'bg-black/25 text-[#09090B]'
                  : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
              }">${tab.badge}</span>
            ` : ''}
          </a>
        `).join('')}
      </nav>
    </div>
  `;

  // Bind Timeline Mode Toggle Click
  headerEl.querySelector('#btn-timeline-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playRelayClick();
    const currentMode = getTimelineMode();
    const nextMode = currentMode === 'mitra54' ? 'ceed87' : 'mitra54';
    setTimelineMode(nextMode);
    renderHeader(container, activeRoute, currentDateStr);
  });

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
