// src/components/icons.js
/**
 * Tabler SVG Vector Glyphs (https://github.com/tabler/tabler-icons)
 * Clean, minimal 14px–16px vector glyphs. Zero raw OS emojis.
 */

export const icons = {
  // 2-tone / colored flame for streak
  flame: (size = 16) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z" fill="#F87171" stroke="#EF4444" />
      <path d="M12 18c1.5 0 2.5 -1.2 2.5 -2.5c0 -1.5 -1 -2.5 -2.5 -3.5c-1.5 1 -2.5 2 -2.5 3.5c0 1.3 1 2.5 2.5 2.5z" fill="#FBBF24" stroke="none" />
    </svg>
  `,

  // Shield
  shield: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
    </svg>
  `,

  // Checkmark
  check: (size = 14, strokeWidth = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M5 12l5 5l10 -10" />
    </svg>
  `,

  // Double Check (for Active Days)
  doubleCheck: (size = 16, strokeWidth = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M7 12l5 5l10 -10" />
      <path d="M2 12l5 5m5 -5l5 -5" />
    </svg>
  `,

  // Alert / Exclamation mark
  alert: (size = 12, strokeWidth = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M12 8v5" />
      <path d="M12 16.5v.01" />
    </svg>
  `,

  // Diagonal Arrow (In Progress / Live)
  arrowUpRight: (size = 12, strokeWidth = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M17 7l-10 10" />
      <path d="M8 7l9 0l0 9" />
    </svg>
  `,

  // Close X
  x: (size = 12, strokeWidth = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  `,

  // Clock
  clock: (size = 12, strokeWidth = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 7v5l3 3" />
    </svg>
  `,

  // Sparkle / 4-point star
  sparkle: (size = 16) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="inline-block shrink-0">
      <path d="M12 3l1.8 5.4l5.4 1.8l-5.4 1.8l-1.8 5.4l-1.8 -5.4l-5.4 -1.8l5.4 -1.8z" />
    </svg>
  `,

  // Circular Question mark
  helpCircle: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v.01" />
      <path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -2" />
    </svg>
  `,

  // Circular Refresh / Arrows
  refresh: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </svg>
  `,

  // Chevron Left & Right
  chevronLeft: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M15 6l-6 6l6 6" />
    </svg>
  `,
  chevronRight: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M9 6l6 6l-6 6" />
    </svg>
  `,

  // Maximize / Screen
  maximize: (size = 14) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
      <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
    </svg>
  `
};
