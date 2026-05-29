const FADE_DURATION = 1.5  // seconds for fade in / fade out

class AudioManager {
  constructor() {
    this._ctx     = null
    this._gain    = null
    this._source  = null
    this._buffers = {}
    this._volume  = 0.8
  }

  _ensureContext() {
    if (this._ctx) return
    this._ctx  = new (window.AudioContext || window.webkitAudioContext)()
    this._gain = this._ctx.createGain()
    this._gain.gain.value = 0
    this._gain.connect(this._ctx.destination)
  }

  async _load(src) {
    if (this._buffers[src]) return this._buffers[src]
    const res    = await fetch(src)
    const raw    = await res.arrayBuffer()
    const buffer = await this._ctx.decodeAudioData(raw)
    this._buffers[src] = buffer
    return buffer
  }

  async play(src) {
    this._ensureContext()

    if (this._ctx.state === 'suspended') await this._ctx.resume()

    this.stop()

    const buffer = await this._load(src)

    this._source        = this._ctx.createBufferSource()
    this._source.buffer = buffer
    this._source.loop   = true
    this._source.connect(this._gain)
    this._source.start()

    // Fade in
    const now = this._ctx.currentTime
    this._gain.gain.cancelScheduledValues(now)
    this._gain.gain.setValueAtTime(0, now)
    this._gain.gain.linearRampToValueAtTime(this._volume, now + FADE_DURATION)
  }

  stop() {
    if (!this._source || !this._ctx) return

    const now = this._ctx.currentTime
    this._gain.gain.cancelScheduledValues(now)
    this._gain.gain.setValueAtTime(this._gain.gain.value, now)
    this._gain.gain.linearRampToValueAtTime(0, now + FADE_DURATION)

    const src = this._source
    setTimeout(() => { try { src.stop() } catch {} }, FADE_DURATION * 1000 + 100)

    this._source = null
  }

  setVolume(v) {
    this._volume = Number(v)
    if (!this._gain) return
    const now = this._ctx.currentTime
    this._gain.gain.cancelScheduledValues(now)
    this._gain.gain.setTargetAtTime(this._volume, now, 0.05)
  }
}

export const audioManager = new AudioManager()
