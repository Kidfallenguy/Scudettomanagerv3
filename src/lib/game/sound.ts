const SOUND_KEY = "scudetto-sound-effects";

export type GameSound = "goal" | "win" | "draw" | "loss" | "sale" | "sign";

let audioContext: AudioContext | null = null;

const SOUND_NOTES: Record<GameSound, number[]> = {
  goal: [659, 784, 988, 1318],
  win: [523, 659, 784, 1047],
  draw: [392, 523],
  loss: [330, 261, 196],
  sale: [784, 988, 1175],
  sign: [523, 659, 784, 1047],
};

export function gameSoundsEnabled() {
  return (
    typeof window === "undefined" ||
    window.localStorage.getItem(SOUND_KEY) !== "off"
  );
}

export function setGameSoundsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
}

export function unlockGameAudio() {
  if (
    typeof window === "undefined" ||
    !gameSoundsEnabled() ||
    !window.AudioContext
  )
    return;
  audioContext ??= new window.AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
}

export function playGameSound(sound: GameSound) {
  if (
    typeof window === "undefined" ||
    !gameSoundsEnabled() ||
    !window.AudioContext
  )
    return;

  unlockGameAudio();
  if (!audioContext) return;

  const start = audioContext.currentTime;
  for (const [index, frequency] of SOUND_NOTES[sound].entries()) {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const noteStart = start + index * 0.085;
    oscillator.type = sound === "loss" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    volume.gain.setValueAtTime(0.0001, noteStart);
    volume.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.018);
    volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.19);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.2);
  }
}
