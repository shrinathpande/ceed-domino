// src/components/status-pill.js

/**
 * Reusable Semantic Tinted Status Pill (Reference 1)
 * @param {'COMPLETED' | 'LIVE' | 'PENDING' | 'UNDER_FLOOR' | 'ROUTINE'} status
 * @param {string} [customLabel] - Optional label override (e.g. "2/4 Dominos" or "20 Marks • 24m")
 * @returns {string} HTML string for the pill
 */
export function renderStatusPill(status, customLabel = null) {
  const normalized = (status || 'PENDING').toUpperCase();

  let bg = 'rgba(245, 158, 11, 0.14)';
  let border = 'rgba(245, 158, 11, 0.4)';
  let text = '#FBBF24';
  let icon = '!';
  let defaultLabel = 'Pending';

  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') {
    bg = 'rgba(16, 185, 129, 0.14)';
    border = 'rgba(16, 185, 129, 0.4)';
    text = '#34D399';
    icon = '✓';
    defaultLabel = 'Completed';
  } else if (normalized === 'LIVE' || normalized === 'ACTIVE' || normalized === 'SUBMITTED') {
    bg = 'rgba(59, 130, 246, 0.15)';
    border = 'rgba(59, 130, 246, 0.45)';
    text = '#60A5FA';
    icon = '↗';
    defaultLabel = 'Live Active';
  } else if (normalized === 'UNDER_FLOOR' || normalized === 'UNDER' || normalized === 'FAILED') {
    bg = 'rgba(239, 68, 68, 0.14)';
    border = 'rgba(239, 68, 68, 0.4)';
    text = '#F87171';
    icon = '✕';
    defaultLabel = 'Under Floor';
  } else if (normalized === 'ROUTINE' || normalized === 'EXPIRED') {
    bg = 'rgba(161, 161, 170, 0.12)';
    border = 'rgba(161, 161, 170, 0.3)';
    text = '#A1A1AA';
    icon = '🕒';
    defaultLabel = 'Routine';
  }

  const label = customLabel || defaultLabel;

  return `
    <span
      class="inline-flex items-center gap-1.5 rounded-full select-none font-medium whitespace-nowrap"
      style="background-color: ${bg}; border: 1px solid ${border}; color: ${text}; padding: 4px 10px; font-size: 11px; line-height: 1;"
    >
      <span class="w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0" style="background-color: ${border}; color: ${text};">
        ${icon}
      </span>
      <span>${label}</span>
    </span>
  `;
}
