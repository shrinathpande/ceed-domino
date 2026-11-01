// src/components/theme-toggle.js
import { getTheme, setTheme, cycleTheme, THEMES } from '../core/state.js';

export function applyTheme() {
  const current = getTheme();
  setTheme(current);
}

export function createThemeToggle() {
  const btn = document.createElement('button');
  btn.className = 'btn-tactile px-2 py-1 text-[10px] font-bold border border-neutral-700 bg-black text-white active:scale-95';
  btn.setAttribute('aria-label', 'Cycle Theme');
  const theme = THEMES.find(t => t.id === getTheme()) || THEMES[0];
  btn.textContent = theme.label;

  btn.addEventListener('click', () => {
    const next = cycleTheme();
    const nextTheme = THEMES.find(t => t.id === next);
    btn.textContent = nextTheme ? nextTheme.label : next;
  });

  return btn;
}
