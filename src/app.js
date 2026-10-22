/**
 * App Shell — handles SPA routing and view switching.
 */
import { renderDashboard } from './views/dashboard.js';
import { renderSettings } from './views/settings.js';

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

  switch (hash) {
    case '#/settings':
      renderSettings(_appContainer, () => {
        window.location.hash = '#/';
      });
      break;

    case '#/':
    default:
      renderDashboard(_appContainer, () => {
        window.location.hash = '#/settings';
      });
      break;
  }
}
