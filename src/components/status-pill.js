// src/components/status-pill.js
/**
 * Renders tactile beveled pastel status pills matching Reference 3
 */
export function renderStatusPill(status = 'PENDING') {
  const configs = {
    COMPLETED: {
      cls: 'pill-completed',
      label: 'Completed',
      svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`
    },
    IN_PROGRESS: {
      cls: 'pill-inprogress',
      label: 'In Progress',
      svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 15 15 9"/><path d="M10 9h5v5"/></svg>`
    },
    UNDER_FLOOR: {
      cls: 'pill-failed',
      label: 'Under Floor',
      svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>`
    },
    ROUTINE: {
      cls: 'pill-routine',
      label: 'Routine',
      svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`
    },
    PENDING: {
      cls: 'pill-pending',
      label: 'Pending',
      svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    }
  };

  const item = configs[status] || configs.PENDING;
  return `
    <span class="status-pill-beveled ${item.cls}">
      ${item.svg}
      <span>${item.label}</span>
    </span>
  `;
}
