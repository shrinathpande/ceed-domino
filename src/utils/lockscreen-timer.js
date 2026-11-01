// src/utils/lockscreen-timer.js
import { playRelayClick } from './sound.js';

const ACTIVE_TIMER_KEY = 'ceed_v2_active_timer';
let silentAudioEl = null;
let lockScreenInterval = null;

// Generates a 1-second silent mono 8kHz PCM WAV data URI in pure JS (Zero external files)
function createSilentWavDataUri() {
  const sampleRate = 8000;
  const numSamples = sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function ensureAudioElement() {
  if (!silentAudioEl) {
    silentAudioEl = new Audio(createSilentWavDataUri());
    silentAudioEl.loop = true;
    silentAudioEl.volume = 0.01;
  }
  return silentAudioEl;
}

export function getActiveTimerState() {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    if (!raw) return { running: false, blockId: null, formatted: '00:00', elapsedMins: 0 };
    const parsed = JSON.parse(raw);
    const elapsedSec = Math.max(0, Math.floor((Date.now() - parsed.startedAt) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = String(elapsedSec % 60).padStart(2, '0');
    return {
      running: true,
      blockId: parsed.blockId,
      title: parsed.title,
      startedAt: parsed.startedAt,
      elapsedSec,
      elapsedMins: Math.round(elapsedSec / 60),
      formatted: `${String(mins).padStart(2, '0')}:${secs}`
    };
  } catch {
    return { running: false, blockId: null, formatted: '00:00', elapsedMins: 0 };
  }
}

export function startLockScreenTimer(arg1, arg2, arg3) {
  let blockId = typeof arg1 === 'string' ? arg1 : arg1?.id || 'd1';
  let title = typeof arg2 === 'string' ? arg2 : (arg1?.name || arg1?.title || 'Domino Session');
  let startedAt = typeof arg2 === 'number' ? arg2 : Date.now();
  let onUpdate = typeof arg3 === 'function' ? arg3 : (typeof arg2 === 'function' ? arg2 : null);

  localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify({ blockId, title, startedAt }));

  const audio = ensureAudioElement();
  audio.play().catch(() => {});

  const updateMetadata = () => {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = String(elapsedSec % 60).padStart(2, '0');

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${mins}m ${secs}s // ${title}`,
        artist: 'ACTIVE DOMINO DRILL',
        album: 'CEED 87-DAY DOMINO TRACKER'
      });
      navigator.mediaSession.playbackState = 'playing';
    }

    if (typeof onUpdate === 'function') onUpdate();
  };

  updateMetadata();
  if (lockScreenInterval) clearInterval(lockScreenInterval);
  lockScreenInterval = setInterval(updateMetadata, 1000);

  if ('mediaSession' in navigator) {
    const handleStop = () => {
      stopLockScreenTimer();
      playRelayClick();
      if (typeof onUpdate === 'function') onUpdate();
    };
    navigator.mediaSession.setActionHandler('pause', handleStop);
    navigator.mediaSession.setActionHandler('stop', handleStop);
  }
}

export function stopLockScreenTimer() {
  let elapsedMins = 0;
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const elapsedSec = Math.max(0, Math.floor((Date.now() - parsed.startedAt) / 1000));
      elapsedMins = Math.max(1, Math.round(elapsedSec / 60));
    }
  } catch {}

  localStorage.removeItem(ACTIVE_TIMER_KEY);

  if (lockScreenInterval) {
    clearInterval(lockScreenInterval);
    lockScreenInterval = null;
  }
  if (silentAudioEl) {
    silentAudioEl.pause();
    silentAudioEl.currentTime = 0;
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
  }

  return elapsedMins;
}
