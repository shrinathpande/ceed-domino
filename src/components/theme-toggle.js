// src/components/theme-toggle.js
import { playRelayClick } from '../utils/sound.js';

const COLOR_MODE_KEY = 'ceed_v2_color_mode';

export function getColorMode() {
  try {
    const saved = localStorage.getItem(COLOR_MODE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  // System preference default
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function setColorMode(mode) {
  const cleanMode = mode === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(COLOR_MODE_KEY, cleanMode);
  } catch {}

  if (cleanMode === 'light') {
    document.documentElement.classList.add('theme-light');
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.setAttribute('data-color-mode', 'light');
  } else {
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add('theme-dark');
    document.documentElement.setAttribute('data-color-mode', 'dark');
  }

  // Update mobile status bar theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
  if (metaTheme) {
    metaTheme.setAttribute('content', cleanMode === 'light' ? '#F5F4F0' : '#000000');
  }

  document.dispatchEvent(new CustomEvent('color-mode-changed', { detail: cleanMode }));
  return cleanMode;
}

export function toggleColorMode() {
  const current = getColorMode();
  const next = current === 'light' ? 'dark' : 'light';
  playRelayClick();
  return setColorMode(next);
}

export function applyTheme() {
  const mode = getColorMode();
  setColorMode(mode);

  // Listen for OS theme changes if user hasn't explicitly set manual preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', (e) => {
      const saved = localStorage.getItem(COLOR_MODE_KEY);
      if (!saved) {
        setColorMode(e.matches ? 'light' : 'dark');
      }
    });
  }
}
