// src/components/bottom-tab-bar.js
import { playRelayClick } from '../utils/sound.js';

export function renderBottomTabBar(container, activeRoute = '#/') {
  const cleanRoute = (activeRoute || window.location.hash || '#/').split('?')[0];

  const tabs = [
    {
      hash: '#/',
      label: 'Today',
      isActive: cleanRoute === '#/' || cleanRoute === '' || cleanRoute === '#',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>`
    },
    {
      hash: '#/goal',
      label: 'Goal',
      hasDot: true,
      isActive: cleanRoute.startsWith('#/goal'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      hash: '#/stats',
      label: 'Stats',
      isActive: cleanRoute.startsWith('#/stats'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
    },
    {
      hash: '#/studio',
      label: 'Studio',
      isActive: cleanRoute.startsWith('#/studio'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 5-3-3L4 13l-1 5 5-1L18 5z"/><path d="m14 6 3 3"/></svg>`
    },
    {
      hash: '#/settings',
      label: 'Config',
      isActive: cleanRoute.startsWith('#/settings'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`
    }
  ];

  let barEl = document.getElementById('nativeIosBottomTabBar');
  if (!barEl) {
    barEl = document.createElement('nav');
    barEl.id = 'nativeIosBottomTabBar';
    barEl.className = 'fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[390px] z-50 floating-glass-dock rounded-full px-2 py-1 select-none transition-all duration-200';
    barEl.setAttribute('aria-label', 'Primary Floating Navigation Dock');
    container.appendChild(barEl);
  }

  barEl.innerHTML = `
    <div class="grid grid-cols-5 gap-1 items-center">
      ${tabs.map(tab => `
        <a
          href="${tab.hash}"
          class="flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-full transition-all ios-spring relative ${
            tab.isActive
              ? 'text-[var(--domino-accent)] font-bold bg-white/[0.08]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
          }"
          aria-current="${tab.isActive ? 'page' : 'false'}"
        >
          <!-- Icon Slot with Subtle Luminous Dot Indicator -->
          <div class="relative flex items-center justify-center w-6 h-6">
            ${tab.icon}
            ${tab.hasDot ? `
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.85)] border border-[#000000]"></span>
            ` : ''}
          </div>

          <!-- Label -->
          <span class="text-[10px] tracking-tight mt-0.5 leading-none">
            ${tab.label}
          </span>
        </a>
      `).join('')}
    </div>
  `;

  // Bind click haptics
  barEl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      playRelayClick();
    });
  });
}
