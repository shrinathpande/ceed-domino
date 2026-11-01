// src/app.js
import { renderDashboard } from './views/dashboard.js';
import { renderSettings } from './views/settings.js';
import { renderStudioProctor } from './views/studio-proctor.js';
import { renderStats } from './views/stats.js';
import { renderHeader } from './components/header.js';
import { renderBottomDock } from './components/bottom-dock.js';
import { initGestureNavigation } from './utils/gestures.js';
import { getTheme, setTheme } from './core/state.js';

let _appContainer = null;
let _viewContainer = null;

/** Initialize the app */
export function initApp(container) {
  _appContainer = container;
  _appContainer.innerHTML = `
    <div id="appShell" class="min-h-screen bg-[var(--ground)] text-[var(--text)] transition-colors relative">
      <div id="headerSlot"></div>
      <main id="viewContainer" class="w-full"></main>
    </div>
  `;

  _viewContainer = document.getElementById('viewContainer');

  // Initialize Theme
  const activeTheme = getTheme();
  setTheme(activeTheme);

  // Initialize Swipe Gestures
  initGestureNavigation();

  // Listen for hash changes
  window.addEventListener('hashchange', () => route());
  route();
}

/** Route to the correct view based on hash */
function route() {
  const hash = window.location.hash || '#/';
  const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const dateParam = urlParams.get('date');

  // Render Top Header
  renderHeader(_appContainer, hash, dateParam);

  // Render Floating Bottom Navigation Dock
  renderBottomDock(_appContainer, hash);

  // Scroll to top on route change
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (hash.startsWith('#/studio')) {
    renderStudioProctor(_viewContainer, () => {
      window.location.hash = '#/';
    }, dateParam);
  } else if (hash.startsWith('#/stats')) {
    renderStats(_viewContainer, () => {
      window.location.hash = '#/';
    });
  } else if (hash.startsWith('#/settings')) {
    renderSettings(_viewContainer, () => {
      window.location.hash = '#/';
    });
  } else {
    renderDashboard(_viewContainer, () => {
      window.location.hash = '#/settings';
    }, dateParam);
  }
}
