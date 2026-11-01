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

/**
 * Standardized alias used across v2.0 modules for tactile feedback
 */
export function playRelayClick() {
  playDing();
}

/**
 * Resonant synthesized chime alert for checkpoint alarms
 * Uses a pure sine harmonic cascade (880Hz -> 1760Hz) with zero external assets.
 */
export function playAlarmTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.setValueAtTime(1760, now + 0.12); // A6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Alarm tone error:', err);
  }
}
