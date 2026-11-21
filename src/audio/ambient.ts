/**
 * Nature soundscape generated live with the Web Audio API: a waterfall, the
 * stream running away from it, wind in the trees and occasional birdsong.
 * Original and royalty-free by construction — no audio files, no licensed music.
 */

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Nodes = {
  master: GainNode
  timers: number[]
  sources: AudioScheduledSourceNode[]
}

export class Ambient {
  private context: AudioContext | null = null
  private nodes: Nodes | null = null
  private volume = 0.5

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

  /** Pink-ish noise: softer and more natural than flat white noise. */
  private noiseBuffer(ctx: AudioContext, seconds = 6) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let b0 = 0
    let b1 = 0
    let b2 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99765 * b0 + white * 0.099046
      b1 = 0.963 * b1 + white * 0.2965164
      b2 = 0.57 * b2 + white * 1.0526913
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16
    }
    return buffer
  }

  /** One bird call: a few quick rising notes, placed somewhere in the trees. */
  private chirp(ctx: AudioContext, master: GainNode, sources: AudioScheduledSourceNode[]) {
    const panner = ctx.createStereoPanner()
    panner.pan.value = rand(-0.85, 0.85)
    panner.connect(master)

    const notes = Math.floor(rand(2, 5))
    const base = rand(1750, 3300)
    let at = ctx.currentTime + 0.05

    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const from = base * rand(0.9, 1.12)
      const to = from * rand(1.08, 1.4)
      const length = rand(0.05, 0.11)
      osc.frequency.setValueAtTime(from, at)
      osc.frequency.exponentialRampToValueAtTime(to, at + length)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(rand(0.03, 0.06), at + length * 0.25)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length)

      osc.connect(gain)
      gain.connect(panner)
      osc.start(at)
      osc.stop(at + length + 0.02)
      sources.push(osc)

      at += length + rand(0.04, 0.12)
    }
  }

  /**
   * Builds and starts the scene. Returns whether sound is actually running —
   * browsers hold audio until the visitor's first gesture, so the caller may
   * call this again from a tap/click/keypress.
   */
  async start(): Promise<boolean> {
    const ctx = this.ensureContext()
    try {
      if (ctx.state !== 'running') await ctx.resume()
    } catch {
      /* still waiting for a gesture; the caller retries */
    }
    if (this.nodes) return ctx.state === 'running'
    if (ctx.state !== 'running') return false

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    const sources: AudioScheduledSourceNode[] = []
    const timers: number[] = []
    const noise = this.noiseBuffer(ctx)

    /** A looping noise voice: one filtered layer of the soundscape. */
    const voice = (type: BiquadFilterType, frequency: number, q: number, level: number) => {
      const source = ctx.createBufferSource()
      source.buffer = noise
      source.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = type
      filter.frequency.value = frequency
      filter.Q.value = q

      const gain = ctx.createGain()
      gain.gain.value = level

      source.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      source.start()
      sources.push(source)

      return { filter, gain }
    }

    // Falling water: a broad rush, a bright foam hiss, and a low rumble.
    const rush = voice('lowpass', 1250, 0.5, 0.34)
    voice('bandpass', 2600, 0.8, 0.07)
    voice('lowpass', 190, 0.7, 0.5)

    // The tighter trickle of the stream running away from the falls.
    const stream = voice('bandpass', 1500, 1.6, 0.05)

    // Wind moving through the trees.
    const wind = voice('bandpass', 620, 0.6, 0.05)

    /** Slow drift, so a looping noise bed never sounds like flat hiss. */
    const drift = (target: AudioParam, rate: number, depth: number) => {
      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = rate
      const amount = ctx.createGain()
      amount.gain.value = depth
      lfo.connect(amount)
      amount.connect(target)
      lfo.start()
      sources.push(lfo)
    }

    drift(rush.filter.frequency, 0.06, 420)
    drift(rush.gain.gain, 0.09, 0.05)
    drift(stream.filter.frequency, 0.23, 260)
    drift(wind.gain.gain, 0.045, 0.03)
    drift(wind.filter.frequency, 0.07, 180)

    this.nodes = { master, timers, sources }
    master.gain.setTargetAtTime(this.volume, ctx.currentTime, 1.2)

    const scheduleBird = () => {
      const timer = window.setTimeout(() => {
        if (!this.nodes) return
        this.chirp(ctx, master, sources)
        if (Math.random() < 0.28) {
          window.setTimeout(() => {
            if (this.nodes) this.chirp(ctx, master, sources)
          }, rand(180, 520))
        }
        scheduleBird()
      }, rand(1600, 5200))
      timers.push(timer)
    }
    scheduleBird()

    return true
  }

  stop() {
    const ctx = this.context
    const nodes = this.nodes
    if (!ctx || !nodes) return
    this.nodes = null

    nodes.timers.forEach((timer) => window.clearTimeout(timer))
    nodes.master.gain.cancelScheduledValues(ctx.currentTime)
    nodes.master.gain.setTargetAtTime(0, ctx.currentTime, 0.4)

    window.setTimeout(() => {
      nodes.sources.forEach((source) => {
        try {
          source.stop()
        } catch {
          /* already stopped */
        }
      })
      try {
        nodes.master.disconnect()
      } catch {
        /* already disconnected */
      }
    }, 1800)
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value))
    if (this.nodes && this.context) {
      this.nodes.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.25)
    }
  }
}
