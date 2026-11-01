/**
 * Entry point for Vite application
 */
import './style.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { GeistPixel } from 'geist/font/pixel/variable';
import { GeistPixelSquare, GeistPixelGrid, GeistPixelCircle, GeistPixelTriangle, GeistPixelLine } from 'geist/font/pixel';
import { GeistSerif, GeistSerifRegular, GeistSerifSquare, GeistSerifTriangle, GeistSerifHeart } from 'geist/font/serif';
import { loadState, getAccentColor, setAccentColor } from './core/state.js';
import { applyTheme } from './components/theme-toggle.js';
import { initApp } from './app.js';
import { unlockAudio } from './utils/sound.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State
  loadState();

  // 2. Setup Theme and Custom Accent Color
  applyTheme();
  setAccentColor(getAccentColor());

  // 3. Mount App
  const appContainer = document.getElementById('app');
  if (appContainer) {
    initApp(appContainer);
  }

  // 4. Register sound unlock on first gesture
  document.addEventListener('pointerdown', unlockAudio, { once: true });
});
