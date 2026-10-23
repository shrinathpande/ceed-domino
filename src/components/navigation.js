/**
 * Bottom Navigation Bar Component — Industrial Brutalist Dock.
 * Quick 1-tap switching between Dashboard, Telemetry Stats, Studio Proctor, and System Settings.
 */
import { icon } from '../icons/index.js';

export function renderBottomNav(activeRoute = '#/') {
  let navEl = document.getElementById('bottomNavDock');
  if (!navEl) {
    navEl = document.createElement('nav');
    navEl.id = 'bottomNavDock';
    navEl.className = 'fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--rule)] font-mono transition-colors';
    navEl.setAttribute('aria-label', 'Main application navigation');
    document.body.appendChild(navEl);
  }

  const cleanRoute = activeRoute.split('?')[0];

  const items = [
    {
      route: '#/',
      label: 'DASHBOARD',
      iconName: 'home',
      isActive: cleanRoute === '#/' || cleanRoute === '' || cleanRoute === '#',
    },
    {
      route: '#/stats',
      label: 'STATS',
      iconName: 'activity',
      isActive: cleanRoute === '#/stats',
    },
    {
      route: '#/studio',
      label: 'STUDIO',
      iconName: 'book',
      isActive: cleanRoute === '#/studio',
    },
    {
      route: '#/settings',
      label: 'CONFIG',
      iconName: 'settings',
      isActive: cleanRoute === '#/settings',
    },
  ];

  navEl.innerHTML = `
    <div class="max-w-xl mx-auto px-3 py-1.5 flex items-center justify-between">
      ${items
        .map(
          (item) => `
        <a
          href="${item.route}"
          class="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-[2px] transition-colors touch-manipulation active:scale-95 ${
            item.isActive
              ? 'text-[var(--text)] font-black'
              : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'
          }"
          aria-label="${item.label} view"
          ${item.isActive ? 'aria-current="page"' : ''}
        >
          <span class="w-4 h-4 mb-0.5 ${item.isActive ? 'text-[var(--text)]' : 'text-[var(--muted)]'}">
            ${icon(item.iconName)}
          </span>
          <span class="text-[9px] tracking-wider uppercase">${item.label}</span>
          ${item.isActive ? '<span class="w-4 h-[2px] bg-[var(--text)] rounded-full mt-0.5"></span>' : '<span class="w-4 h-[2px] bg-transparent mt-0.5"></span>'}
        </a>
      `
        )
        .join('')}
    </div>
  `;
}
