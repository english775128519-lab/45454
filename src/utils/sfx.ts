let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioCtx) {
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedAudioCtx = new Ctor();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  durationSec: number,
  delaySec: number,
  type: OscillatorType = 'sine',
  peakGain = 0.14
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + durationSec + 0.02);
  } catch {
    // ignore audio hardware errors
  }
}

export function playTapPop(enabled = true) {
  if (!enabled) return;
  playTone(540, 0.06, 0, 'triangle', 0.08);
}

export function playSuccessChime(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.12, 0, 'sine', 0.14); // C5
  playTone(659.25, 0.18, 0.08, 'sine', 0.16); // E5
}

export function playStreakChime(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.1, 0, 'sine', 0.13); // C5
  playTone(659.25, 0.1, 0.07, 'sine', 0.14); // E5
  playTone(783.99, 0.18, 0.14, 'triangle', 0.16); // G5
}

export function playErrorThud(enabled = true) {
  if (!enabled) return;
  playTone(240, 0.12, 0, 'triangle', 0.12);
  playTone(185, 0.18, 0.09, 'triangle', 0.12);
}

export function playStageCompleteFanfare(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.11, 0, 'triangle', 0.13); // C5
  playTone(659.25, 0.11, 0.09, 'triangle', 0.13); // E5
  playTone(783.99, 0.11, 0.18, 'triangle', 0.14); // G5
  playTone(1046.5, 0.28, 0.27, 'sine', 0.17); // C6
}
