/**
 * Theme Toggle — Light / Dark / System mode switcher.
 */
import { getState, updateSettings } from '../core/state.js';
import { icon } from '../icons/index.js';

/** Apply the current theme to the document */
export function applyTheme() {
  const state = getState();
  const theme = state.settings.theme || 'system';
  const root = document.documentElement;

  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/** Create the theme toggle button */
export function createThemeToggle() {
  const state = getState();
  const isDark = document.documentElement.classList.contains('dark');

  const btn = document.createElement('button');
  btn.className = 'w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors touch-manipulation active:scale-95';
  btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  btn.innerHTML = `<span class="w-4.5 h-4.5">${icon(isDark ? 'sun' : 'moon')}</span>`;

  btn.addEventListener('click', () => {
    const current = getState().settings.theme;
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    updateSettings({ theme: next });
    applyTheme();
  });

  return btn;
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getState().settings.theme === 'system') {
    applyTheme();
  }
});
