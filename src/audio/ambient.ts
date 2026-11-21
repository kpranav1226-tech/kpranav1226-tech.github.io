/**
 * Ambient soundtrack generated live with the Web Audio API.
 * Original, royalty-free by construction: no audio files, no licensed music.
 */

type Nodes = {
  master: GainNode
  padGain: GainNode
  windGain: GainNode
  oscillators: OscillatorNode[]
  timers: number[]
}

const CHORDS: number[][] = [
  [130.81, 196.0, 261.63, 329.63], // Cmaj7-ish
  [110.0, 164.81, 220.0, 329.63], // Am
  [87.31, 174.61, 220.0, 261.63], // Fmaj
  [98.0, 146.83, 196.0, 293.66], // G
]

export class Ambient {
  private context: AudioContext | null = null
  private nodes: Nodes | null = null
  private chordIndex = 0
  private volume = 0.55

  get isPlaying() {
    return this.nodes !== null
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.context = new Ctor()
    }
    return this.context
  }

  async start() {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    if (this.nodes) return

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    const padGain = ctx.createGain()
    padGain.gain.value = 0.5

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1200
    filter.Q.value = 0.6

    padGain.connect(filter)
    filter.connect(master)

    // gentle delay for space
    const delay = ctx.createDelay(1.5)
    delay.delayTime.value = 0.42
    const feedback = ctx.createGain()
    feedback.gain.value = 0.32
    const wet = ctx.createGain()
    wet.gain.value = 0.3
    filter.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(master)

    const oscillators: OscillatorNode[] = []
    const timers: number[] = []

    const chord = CHORDS[0]
    chord.forEach((frequency, index) => {
      ;[-4, 4].forEach((detune) => {
        const osc = ctx.createOscillator()
        osc.type = index === 0 ? 'sine' : 'triangle'
        osc.frequency.value = frequency
        osc.detune.value = detune
        const gain = ctx.createGain()
        gain.gain.value = 0.055 / (index * 0.4 + 1)
        osc.connect(gain)
        gain.connect(padGain)
        osc.start()
        oscillators.push(osc)
      })
    })

    // slow chord progression
    const progression = window.setInterval(() => {
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length
      const next = CHORDS[this.chordIndex]
      oscillators.forEach((osc, i) => {
        const target = next[Math.floor(i / 2) % next.length]
        osc.frequency.setTargetAtTime(target, ctx.currentTime, 3.2)
      })
    }, 12000)
    timers.push(progression)

    // wind / water hiss
    const bufferSize = Math.floor(ctx.sampleRate * 4)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 520
    noiseFilter.Q.value = 0.5
    const windGain = ctx.createGain()
    windGain.gain.value = 0.05
    noise.connect(noiseFilter)
    noiseFilter.connect(windGain)
    windGain.connect(master)
    noise.start()

    // soft bell notes
    const bell = window.setInterval(() => {
      if (!this.nodes) return
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0]
      const frequency = notes[Math.floor(Math.random() * notes.length)]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.6)
      osc.connect(gain)
      gain.connect(master)
      gain.connect(delay)
      osc.start()
      osc.stop(ctx.currentTime + 2.8)
    }, 5200)
    timers.push(bell)

    this.nodes = { master, padGain, windGain, oscillators, timers }
    master.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.9)
  }

  stop() {
    const ctx = this.context
    const nodes = this.nodes
    if (!ctx || !nodes) return
    this.nodes = null
    nodes.timers.forEach((timer) => window.clearInterval(timer))
    nodes.master.gain.setTargetAtTime(0, ctx.currentTime, 0.35)
    window.setTimeout(() => {
      nodes.oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      })
    }, 1200)
  }

  toggle() {
    if (this.isPlaying) this.stop()
    else void this.start()
  }

  setVolume(value: number) {
    this.volume = value
    if (this.nodes && this.context) {
      this.nodes.master.gain.setTargetAtTime(value, this.context.currentTime, 0.15)
    }
  }
}
