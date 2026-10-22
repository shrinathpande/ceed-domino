/**
 * Sound utility — Web Audio API synthesized mechanical relay latch & tactile click.
 * High-precision industrial feedback with zero external audio assets.
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

/** Unlock audio on first user gesture */
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

/**
 * Heavy mechanical relay "thud" / snap.
 * Dual-stage transient: initial metal leaf contact snap followed by low-frequency damp body thud.
 */
export function playDing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Stage 1: Initial high mechanical contact click (sharp transient impulse)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

    snapGain.gain.setValueAtTime(0.001, now);
    snapGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.035);

    // Stage 2: Heavy low-frequency body relay "thud"
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(130, now);
    thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

    thudGain.gain.setValueAtTime(0.001, now);
    thudGain.gain.linearRampToValueAtTime(0.5, now + 0.004);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.085);
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
