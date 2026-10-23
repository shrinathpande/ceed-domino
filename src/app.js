/**
 * App Shell — handles SPA routing and view switching.
 */
import { renderDashboard } from './views/dashboard.js';
import { renderSettings } from './views/settings.js';
import { renderStudioProctor } from './views/studio-proctor.js';

let _appContainer = null;

/** Initialize the app */
export function initApp(container) {
  _appContainer = container;

  // Handle hash-based routing
  window.addEventListener('hashchange', () => route());
  route();
}

/** Route to the correct view based on hash */
function route() {
  const hash = window.location.hash || '#/';

  if (hash.startsWith('#/studio')) {
    // Extract date query parameter if present (e.g. #/studio?date=2026-10-22)
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const dateParam = urlParams.get('date');
    renderStudioProctor(
      _appContainer,
      () => {
        window.location.hash = '#/';
      },
      dateParam
    );
  } else if (hash === '#/settings') {
    renderSettings(_appContainer, () => {
      window.location.hash = '#/';
    });
  } else {
    renderDashboard(_appContainer, () => {
      window.location.hash = '#/settings';
    });
  }
}
