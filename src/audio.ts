let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AC = window.AudioContext || w.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function click(audio: AudioContext, time: number) {
  const length = Math.floor(audio.sampleRate * 0.03);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const env = 1 - i / length;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 900;
  filter.Q.value = 0.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start(time);
  src.stop(time + 0.032);
}

function ring(audio: AudioContext, time: number) {
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, time);
  master.gain.exponentialRampToValueAtTime(0.22, time + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
  master.connect(audio.destination);

  for (const [freq, type] of [
    [740, "sine"],
    [1480, "triangle"],
  ] as const) {
    const osc = audio.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, time + 0.4);
    const gain = audio.createGain();
    gain.gain.value = freq > 1000 ? 0.25 : 1;
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 0.56);
  }
}

export function playToss(durationMs: number) {
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime + 0.02;
  const duration = Math.max(0.05, durationMs / 1000);
  if (duration > 0.25) {
    let t = 0;
    let step = 0.048;
    while (t < duration - 0.16) {
      click(audio, now + t);
      t += step;
      step *= 1.085;
    }
  }
  ring(audio, now + Math.max(0, duration - 0.06));
}
