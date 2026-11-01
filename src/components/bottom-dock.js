// src/components/bottom-dock.js
import { playRelayClick } from '../utils/sound.js';

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
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M8 15h2v2h-2z"/></svg>`
    },
    {
      hash: '#/stats',
      label: 'Stats',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M20 18v-4"/><path d="M16 18v-8"/><path d="M12 18v-2"/><path d="M8 18v-5"/></svg>`
    },
    {
      hash: '#/studio',
      label: 'Studio',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>`
    },
    {
      hash: '#/settings',
      label: 'Config',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M18 4v1"/><path d="M18 9v11"/></svg>`
    }
  ];

  dock.innerHTML = `
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#121214] border border-[#1F1F23]"
      style="padding-bottom: max(6px, env(safe-area-inset-bottom, 0px));"
    >
      ${tabs.map(tab => {
        const isActive = cleanRoute === tab.hash || (tab.hash === '#/' && (cleanRoute === '' || cleanRoute === '#'));
        return `
          <a
            href="${tab.hash}"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-all btn-tactile ${
              isActive
                ? 'bg-[#F4F4F6] text-[#09090B] font-semibold'
                : 'text-[#A1A1AA] hover:text-[#F4F4F6] font-medium'
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
