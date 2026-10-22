/**
 * Sound utility — Web Audio API synthesized chime + optional external audio.
 * Zero external audio file dependencies needed! Works across all mobile & desktop browsers.
 */

let _audioCtx = null;
let _unlocked = false;

function getAudioContext() {
  if (!_audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _audioCtx = new AudioContextClass();
    }
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

/** Unlock audio on first user interaction */
export function unlockAudio() {
  if (_unlocked) return;
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        _unlocked = true;
      }).catch(() => {});
    } else {
      _unlocked = true;
    }
  }
}

/** Play a crisp Apple-like affirmative bell/chime */
export function playDing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Dual-tone harmonic bell (high bell + undertone)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // Slight pitch rise

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now); // E6

    // Envelope
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Web Audio playback error:', err);
  }
}
