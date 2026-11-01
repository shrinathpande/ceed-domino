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

export function playBeep(freq = 880, duration = 0.2) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (err) {
    console.warn('Beep audio error:', err);
  }
}

/**
 * Ascending Harmonic Mechanical Victory Chime (A-Major Triad: A4 → C#5 → E5)
 * Celebratory 100% Domino Completion Feedback synthesized via Web Audio API.
 */
export function playVictoryChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 440.00, timeOffset: 0.00, dur: 0.45 }, // A4
      { freq: 554.37, timeOffset: 0.10, dur: 0.50 }, // C#5
      { freq: 659.25, timeOffset: 0.20, dur: 0.70 }  // E5
    ];

    const now = ctx.currentTime;

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

      const startTime = now + note.timeOffset;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.05);
    });

    // Tactile haptic vibration pattern for mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
  } catch (err) {
    console.warn('Victory chime audio error:', err);
  }
}
