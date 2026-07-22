let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// صوت إغلاق باب حديدي ثقيل: دبة تردد منخفض + طقة معدنية (ضجيج مصفّى)
export function playDoorSlam() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(130, now);
  thud.frequency.exponentialRampToValueAtTime(38, now + 0.35);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  thud.connect(thudGain).connect(ctx.destination);
  thud.start(now);
  thud.stop(now + 0.55);

  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const clank = ctx.createBufferSource();
  clank.buffer = buffer;

  const clankFilter = ctx.createBiquadFilter();
  clankFilter.type = "bandpass";
  clankFilter.frequency.value = 900;
  clankFilter.Q.value = 0.8;

  const clankGain = ctx.createGain();
  clankGain.gain.setValueAtTime(0.5, now);
  clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  clank.connect(clankFilter).connect(clankGain).connect(ctx.destination);
  clank.start(now);
}

// صوت نبضة قلب (lub-dub) عند الضغط على خيار/زر مصيري
export function playHeartbeat() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  function thump(t, freq, dur, vol) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  thump(now, 62, 0.15, 0.75);
  thump(now + 0.22, 52, 0.18, 0.55);
}
