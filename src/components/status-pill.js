// src/components/status-pill.js
import { icons } from './icons.js';

/**
 * Reference 1: Opaque Soft Pastel Status Pills
 * Flat, opaque pastel capsule pills with deep ink text and vector glyphs. Zero glow.
 * @param {'COMPLETED' | 'LIVE' | 'IN_PROGRESS' | 'PENDING' | 'UNDER_FLOOR' | 'ROUTINE'} status
 * @param {string} [customLabel] - Optional label override
 * @returns {string} HTML string
 */
export function renderStatusPill(status, customLabel = null) {
  const normalized = (status || 'PENDING').toUpperCase();

  let bg = '#FDE6C4';
  let border = '#F5C986';
  let text = '#9A5806';
  let iconSvg = icons.alert(11);
  let defaultLabel = 'Pending';

  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') {
    bg = '#C6F6D5';
    border = '#9AE6B4';
    text = '#18794E';
    iconSvg = icons.check(11, 3);
    defaultLabel = 'Completed';
  } else if (normalized === 'LIVE' || normalized === 'ACTIVE' || normalized === 'IN_PROGRESS' || normalized === 'SUBMITTED') {
    bg = '#D8E2FF';
    border = '#ADC2FF';
    text = '#244BC5';
    iconSvg = icons.arrowUpRight(11, 3);
    defaultLabel = 'In Progress';
  } else if (normalized === 'UNDER_FLOOR' || normalized === 'UNDER' || normalized === 'FAILED') {
    bg = '#FFD6D6';
    border = '#FEB2B2';
    text = '#B91C1C';
    iconSvg = icons.x(11, 3);
    defaultLabel = 'Under Floor';
  } else if (normalized === 'ROUTINE' || normalized === 'OPTIONAL' || normalized === 'EXPIRED') {
    bg = '#E4E4E7';
    border = '#D4D4D8';
    text = '#27272A';
    iconSvg = icons.clock(11, 2.5);
    defaultLabel = 'Routine';
  }

  const label = customLabel || defaultLabel;

  return `
    <span
      class="inline-flex items-center gap-[5px] select-none font-semibold whitespace-nowrap"
      style="border-radius: 9999px; padding: 3px 10px 3px 8px; font-size: 11px; line-height: 1; background-color: ${bg}; border: 1px solid ${border}; color: ${text};"
    >
      <span class="inline-flex items-center justify-center shrink-0" style="color: ${text};">
        ${iconSvg}
      </span>
      <span>${label}</span>
    </span>
  `;
}
