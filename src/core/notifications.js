/**
 * Notifications — Web Push API, vibration, and audio alerts.
 */

/** Request notification permission */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

/** Show a notification */
export function showNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

/** Trigger haptic vibration */
export function vibrate(pattern = [50]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Strong vibration for timer completion */
export function vibrateCompletion() {
  vibrate([200, 100, 200, 100, 300]);
}

/** Short tap vibration for UI feedback */
export function vibrateTap() {
  vibrate([15]);
}
