// Efectos de sonido chiptune (onda cuadrada, estilo 8 bits) generados con Web Audio

type Note = [freq: number, start: number, duration: number]

let ctx: AudioContext | null = null

function play(notes: Note[], volume = 0.08): void {
  ctx ??= new AudioContext()
  const ac = ctx
  if (ac.state === 'suspended') void ac.resume()
  const now = ac.currentTime + 0.02
  for (const [freq, start, duration] of notes) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const t = now + start
    osc.type = 'square'
    osc.frequency.value = freq
    // Envolvente seca, como un chip de sonido antiguo
    gain.gain.setValueAtTime(volume, t)
    gain.gain.setValueAtTime(volume, t + duration * 0.75)
    gain.gain.linearRampToValueAtTime(0, t + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + duration + 0.02)
  }
}

const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const B5 = 987.77
const C6 = 1046.5
const E6 = 1318.51
const G6 = 1567.98

export const sfx = {
  start: (): void =>
    play([
      [C5, 0, 0.06],
      [C6, 0.06, 0.09]
    ]),
  pause: (): void =>
    play([
      [G5, 0, 0.06],
      [C5, 0.07, 0.09]
    ]),
  complete: (): void =>
    play([
      [C5, 0, 0.09],
      [E5, 0.09, 0.09],
      [G5, 0.18, 0.09],
      [C6, 0.27, 0.35],
      [E6, 0.27, 0.35]
    ]),
  breakOver: (): void =>
    play([
      [G5, 0, 0.1],
      [G5, 0.15, 0.1],
      [C6, 0.3, 0.28]
    ]),
  levelUp: (): void =>
    play([
      [G5, 0, 0.07],
      [C6, 0.07, 0.07],
      [E6, 0.14, 0.07],
      [G6, 0.21, 0.07],
      [E6, 0.3, 0.07],
      [G6, 0.37, 0.45],
      [C6, 0.37, 0.45]
    ]),
  achievement: (): void =>
    play([
      [B5, 0, 0.08],
      [E6, 0.08, 0.08],
      [B5, 0.16, 0.08],
      [E6, 0.24, 0.08],
      [G6, 0.32, 0.4]
    ]),
  mission: (): void =>
    play([
      [E5, 0, 0.1],
      [G5, 0.1, 0.1],
      [B5, 0.2, 0.1],
      [E6, 0.3, 0.45]
    ])
}
