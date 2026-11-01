// src/components/bottom-dock.js
import { playRelayClick } from '../utils/sound.js';
import { getAccentColor } from '../core/state.js';

export function renderBottomDock(container, activeRoute = '#/') {
  let dock = document.getElementById('floatingBottomDock');
  if (!dock) {
    dock = document.createElement('nav');
    dock.id = 'floatingBottomDock';
    dock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[360px] select-none';
    dock.setAttribute('aria-label', 'Main Navigation');
    container.appendChild(dock);
  }

  const cleanRoute = (activeRoute || window.location.hash || '#/').split('?')[0];

  const tabs = [
    {
      hash: '#/',
      label: 'Today',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
    },
    {
      hash: '#/stats',
      label: 'Stats',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`
    },
    {
      hash: '#/studio',
      label: 'Studio',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`
    },
    {
      hash: '#/settings',
      label: 'Config',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`
    }
  ];

  dock.innerHTML = `
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#16161A]/90 backdrop-blur-md border border-white/[0.08] shadow-2xl shadow-black/80"
      style="padding-bottom: max(6px, env(safe-area-inset-bottom, 0px));"
    >
      ${tabs.map(tab => {
        const isActive = cleanRoute === tab.hash || (tab.hash === '#/' && (cleanRoute === '' || cleanRoute === '#'));
        return `
          <a
            href="${tab.hash}"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
              isActive
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }"
            aria-current="${isActive ? 'page' : 'false'}"
          >
            ${tab.icon}
            <span>${tab.label}</span>
          </a>
        `;
      }).join('')}
    </div>
  `;

  dock.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      playRelayClick();
    });
  });
}
