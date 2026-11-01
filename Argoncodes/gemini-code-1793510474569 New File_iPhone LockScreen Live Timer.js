// src/utils/lockscreen-timer.js
import { playRelayClick } from './sound.js';

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

export function startLockScreenTimer(block, startedAt, onRemoteStop) {
  const audio = ensureAudioElement();
  audio.play().catch(() => {});

  const updateMetadata = () => {
    if (!('mediaSession' in navigator)) return;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = String(elapsedSec % 60).padStart(2, '0');
    const targetHrs = ((block.targetMins || 60) / 60).toFixed(1);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${mins}m ${secs}s // ${block.name}`,
      artist: `${block.badge} • TARGET: ${targetHrs}H`,
      album: 'CEED 87-DAY DOMINO TRACKER'
    });
    navigator.mediaSession.playbackState = 'playing';
  };

  updateMetadata();
  if (lockScreenInterval) clearInterval(lockScreenInterval);
  lockScreenInterval = setInterval(updateMetadata, 1000);

  if ('mediaSession' in navigator) {
    const handleStop = () => {
      stopLockScreenTimer();
      playRelayClick();
      if (typeof onRemoteStop === 'function') onRemoteStop();
    };
    navigator.mediaSession.setActionHandler('pause', handleStop);
    navigator.mediaSession.setActionHandler('stop', handleStop);
  }
}

export function stopLockScreenTimer() {
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
}