/**
 * Entry point for Vite application
 */
import './style.css';
import { loadState } from './core/state.js';
import { applyTheme } from './components/theme-toggle.js';
import { initApp } from './app.js';
import { unlockAudio } from './utils/sound.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State
  loadState();

  // 2. Setup Theme based on state / system preferences
  applyTheme();

  // 3. Mount App
  const appContainer = document.getElementById('app');
  if (appContainer) {
    initApp(appContainer);
  }

  // 4. Register sound unlock on first gesture
  document.addEventListener('pointerdown', unlockAudio, { once: true });
});
