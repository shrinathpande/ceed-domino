// src/components/header.js
import { getState, getCumulativeTelemetry } from '../core/state.js';
import { getDayIndex, getExamCountdown } from '../utils/dates.js';
import { icons } from './icons.js';
import { getColorMode, toggleColorMode } from './theme-toggle.js';
import { playRelayClick } from '../utils/sound.js';

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

  toast.innerHTML = `
    <div style="flex: 1; padding-right: 8px;">${msg}</div>
    <button style="background: transparent; border: none; color: inherit; font-weight: bold; font-size: 13px; cursor: pointer; padding: 0 4px; line-height: 1;" aria-label="Dismiss">✕</button>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 9999;
    padding: 8px 16px;
    font-size: 12px;
    font-family: var(--font-sans);
    font-weight: 600;
    border: 1px solid var(--border-subtle);
    background-color: var(--surface-well);
    color: var(--text-primary);
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

  headerEl.innerHTML = `
    <div class="max-w-[390px] mx-auto px-3.5 pt-2.5 pb-2">
      <!-- Row 1: Telemetry, Countdown, Sun/Moon Theme Toggle, Shield & Streak -->
      <div class="flex items-center justify-between mb-2">
        <!-- Left: Day of 87 + [XXd to CEED] -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Day ${String(dayIndex + 1).padStart(2, '0')} <span class="text-[#71717A] font-normal">of 87</span>
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#18181E] text-[#A1A1AA] border border-white/[0.07]">
            ${examCountdown.compact} to CEED
          </span>
        </div>

        <!-- Right: Sun/Moon Theme Toggle + Shield Badge + Streak Pill -->
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

          <!-- Shield Badge -->
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-[#18191E] border border-white/[0.08] text-[#A1A1AA]">
            <span class="text-[#A1A1AA]">${icons.shield(12)}</span>
            <span class="text-[var(--text-primary)] font-bold">${state.shields || 0}</span>
          </div>

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
