// src/utils/gestures.js
import { playRelayClick } from './sound.js';

const ROUTE_SEQUENCE = ['#/', '#/stats', '#/studio', '#/settings'];

let startX = 0;
let startY = 0;
let startTime = 0;
let isBound = false;

export function initGestureNavigation() {
  if (isBound) return;
  isBound = true;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    // Don't intercept if touching an input, slider, or horizontal matrix scroll
    const target = e.target;
    if (target.closest('input, textarea, select, [data-no-swipe]')) return;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = e.changedTouches[0].clientY - startY;
    const elapsed = Date.now() - startTime;

    // Must be a quick, predominantly horizontal swipe (speed & direction check)
    if (elapsed > 450) return;
    if (Math.abs(deltaX) < 60) return; // At least 60px swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.75) return; // Avoid triggering on vertical scroll

    const currentHash = (window.location.hash || '#/').split('?')[0];
    let currentIndex = ROUTE_SEQUENCE.indexOf(currentHash);
    if (currentIndex === -1) currentIndex = 0;

    if (deltaX < 0) {
      // Swipe Left -> Next View
      if (currentIndex < ROUTE_SEQUENCE.length - 1) {
        window.location.hash = ROUTE_SEQUENCE[currentIndex + 1];
        triggerHaptic();
      }
    } else {
      // Swipe Right -> Previous View
      if (currentIndex > 0) {
        window.location.hash = ROUTE_SEQUENCE[currentIndex - 1];
        triggerHaptic();
      }
    }
  }, { passive: true });
}

function triggerHaptic() {
  try {
    playRelayClick();
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {}
}
