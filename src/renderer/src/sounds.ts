export type SoundName = 'chime' | 'ping' | 'ding' | 'pop' | 'chord'

export const SOUND_OPTIONS: { value: SoundName; label: string }[] = [
  { value: 'chime', label: 'Chime' },
  { value: 'ping', label: 'Ping' },
  { value: 'ding', label: 'Ding' },
  { value: 'pop', label: 'Pop' },
  { value: 'chord', label: 'Chord' }
]

export async function playSound(name: SoundName): Promise<void> {
  const ctx = new AudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  switch (name) {
    case 'chime':
      // Two-note ascending: G5 → C6
      playNotes(ctx, [
        { freq: 783.99, start: 0, type: 'sine', peak: 0.18, duration: 0.35 },
        { freq: 1046.5, start: 0.12, type: 'sine', peak: 0.18, duration: 0.35 }
      ])
      break

    case 'ping':
      // Single crisp high note
      playNotes(ctx, [
        { freq: 1318.5, start: 0, type: 'sine', peak: 0.22, duration: 0.4 }
      ])
      break

    case 'ding':
      // Bell-like triangle wave
      playNotes(ctx, [
        { freq: 880, start: 0, type: 'triangle', peak: 0.3, duration: 0.6 },
        { freq: 1760, start: 0, type: 'triangle', peak: 0.08, duration: 0.4 }
      ])
      break

    case 'pop':
      // Short soft pop
      playNotes(ctx, [
        { freq: 440, start: 0, type: 'sine', peak: 0.25, duration: 0.08 },
        { freq: 660, start: 0.04, type: 'sine', peak: 0.15, duration: 0.06 }
      ])
      break

    case 'chord':
      // Three-note major chord: C5, E5, G5
      playNotes(ctx, [
        { freq: 523.25, start: 0, type: 'sine', peak: 0.12, duration: 0.5 },
        { freq: 659.25, start: 0, type: 'sine', peak: 0.12, duration: 0.5 },
        { freq: 783.99, start: 0, type: 'sine', peak: 0.12, duration: 0.5 }
      ])
      break
  }
}

interface NoteSpec {
  freq: number
  start: number
  type: OscillatorType
  peak: number
  duration: number
}

function playNotes(ctx: AudioContext, notes: NoteSpec[]): void {
  notes.forEach(({ freq, start, type, peak, duration }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = ctx.currentTime + start
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(peak, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  })
}
