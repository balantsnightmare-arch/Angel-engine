// Web Audio API Synthesizer for Retro Evangelion NERV HUD sound effects

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playBeep(freq = 880, duration = 0.05, type: OscillatorType = 'sine') {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio playback errors
  }
}

export function playCodeType() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High pitched blip
    const freq = 1200 + Math.random() * 400;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
}

export function playAlarm() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

// --- Text-to-Speech ---

export type NodeVoiceConfig = {
  pitch: number;
  rate: number;
  preferredVoiceName?: string[];
  gender: "male" | "female";
  ageHint: "young" | "middle";
};

const NODE_VOICES: Record<string, NodeVoiceConfig> = {
  node1: { pitch: 0.95, rate: 0.95, gender: "male", ageHint: "young",
    preferredVoiceName: ["Microsoft Guy Online", "Microsoft Ryan Online", "Google UK English Male", "Microsoft David", "David", "Daniel"] },
  node2: { pitch: 1.05, rate: 1.08, gender: "female", ageHint: "young",
    preferredVoiceName: ["Microsoft Jenny Online", "Microsoft Aria Online", "Google UK English Female", "Microsoft Zira", "Zira", "Samantha"] },
  node3: { pitch: 0.9, rate: 1.0, gender: "male", ageHint: "middle",
    preferredVoiceName: ["Microsoft Christopher Online", "Microsoft Eric Online", "Google US English", "Microsoft Mark", "Mark", "Tom"] },
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

function findVoice(config: NodeVoiceConfig): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  for (const name of config.preferredVoiceName || []) {
    const match = voices.find(v => v.name.includes(name));
    if (match) return match;
  }

  const englishVoices = voices.filter(v => v.lang.startsWith("en"));
  if (englishVoices.length > 0) {
    if (config.gender === "female") {
      const fem = englishVoices.find(v =>
        /female|zira|samantha|karen|fiona|victoria|susan|jenny|aria/i.test(v.name));
      if (fem) return fem;
    } else {
      const mal = englishVoices.find(v =>
        /male|david|mark|daniel|alex|fred|tom|reed|guy|james/i.test(v.name));
      if (mal) return mal;
    }
    return englishVoices[0];
  }

  return voices[0];
}

export function speakText(text: string, nodeId: string, onEnd?: () => void): void {
  if (!('speechSynthesis' in window)) return;

  stopSpeaking();

  const config = NODE_VOICES[nodeId] || NODE_VOICES.node1;
  const utterance = new SpeechSynthesisUtterance(text);

  const voice = findVoice(config);
  if (voice) utterance.voice = voice;

  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 1;

  currentUtterance = utterance;
  utterance.onend = () => { currentUtterance = null; onEnd?.(); };
  utterance.onerror = () => { currentUtterance = null; onEnd?.(); };

  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && speechSynthesis.speaking;
}

export function playChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C Major chord

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (e) {}
}
