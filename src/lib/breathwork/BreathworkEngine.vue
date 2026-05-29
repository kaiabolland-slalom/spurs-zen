<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { breathState } from '../session/breathState.js'
import { audioManager } from '../audio/AudioManager.js'

const PATTERNS = {
  box: {
    label: 'Box',
    description: 'Inhale for 4, hold for 4, exhale for 4, hold for 4',
    phases: [
      { name: 'breathe in',  duration: 4, scaleFrom: 0.65, scaleTo: 1.0 },
      { name: 'hold',        duration: 4, scaleFrom: 1.0,  scaleTo: 1.0 },
      { name: 'breathe out', duration: 4, scaleFrom: 1.0,  scaleTo: 0.65 },
      { name: 'hold',        duration: 4, scaleFrom: 0.65, scaleTo: 0.65 },
    ],
  },
  '478': {
    label: '4–7–8',
    description: 'Inhale for 4, hold for 7, exhale for 8',
    phases: [
      { name: 'breathe in',  duration: 4, scaleFrom: 0.65, scaleTo: 1.0 },
      { name: 'hold',        duration: 7, scaleFrom: 1.0,  scaleTo: 1.0 },
      { name: 'breathe out', duration: 8, scaleFrom: 1.0,  scaleTo: 0.65 },
    ],
  },
  resonance: {
    label: 'Resonance',
    description: 'Inhale for 5, exhale for 5',
    phases: [
      { name: 'breathe in',  duration: 5, scaleFrom: 0.65, scaleTo: 1.0 },
      { name: 'breathe out', duration: 5, scaleFrom: 1.0,  scaleTo: 0.65 },
    ],
  },
}

const SESSION_DURATIONS = [
  { label: '1 min', value: 1 },
  { label: '3 min', value: 3 },
  { label: '5 min', value: 5 },
]

const RING_RADIUS = 128
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const screen = ref('setup')
const selectedPattern = ref('box')
const selectedDuration = ref(1)
const selectedAudio = ref('waves')
const volume = ref(0.8)

const phaseIndex    = ref(0)
const phaseElapsed  = ref(0)
const sessionElapsed = ref(0)
const cycleCount    = ref(0)
const phaseName     = ref('')

// Direct DOM refs — written every frame, bypassing Vue reactivity for 60fps accuracy
const ringEl       = ref(null)
const leadingDotEl = ref(null)

let rafId    = null
let lastTs   = null
let wakeLock = null

const pattern      = computed(() => PATTERNS[selectedPattern.value])
const totalSeconds = computed(() => selectedDuration.value * 60)

// Dot at the start of each phase, positioned on the ring
const tickMarks = computed(() => {
  const phases = pattern.value.phases
  const cycleDuration = phases.reduce((s, p) => s + p.duration, 0)
  let cumulative = 0
  return phases.map(phase => {
    const angle = -Math.PI / 2 + (cumulative / cycleDuration) * 2 * Math.PI
    cumulative += phase.duration
    return {
      cx: 150 + RING_RADIUS * Math.cos(angle),
      cy: 150 + RING_RADIUS * Math.sin(angle),
    }
  })
})

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function tick(ts) {
  if (!lastTs) lastTs = ts

  const delta = Math.min((ts - lastTs) / 1000, 0.1)
  lastTs = ts

  phaseElapsed.value  += delta
  sessionElapsed.value += delta

  const phases = pattern.value.phases
  let phase = phases[phaseIndex.value]

  if (phaseElapsed.value >= phase.duration) {
    const overshoot = phaseElapsed.value - phase.duration
    const next = (phaseIndex.value + 1) % phases.length
    if (next === 0) cycleCount.value++
    phaseIndex.value   = next
    phaseElapsed.value = overshoot
    phase = phases[next]
  }

  const t     = easeInOut(Math.min(phaseElapsed.value / phase.duration, 1))
  const scale = phase.scaleFrom + (phase.scaleTo - phase.scaleFrom) * t

  // Share state with Gallery
  breathState.scale      = scale
  breathState.cycleCount = cycleCount.value
  breathState.phaseDir   = phase.scaleTo > phase.scaleFrom ? 1 : phase.scaleTo < phase.scaleFrom ? -1 : 0

  // Cycle progress for ring arc + leading dot
  let cycleElapsed = phaseElapsed.value
  for (let i = 0; i < phaseIndex.value; i++) cycleElapsed += phases[i].duration
  const cycleDuration  = phases.reduce((s, p) => s + p.duration, 0)
  const cycleProgress  = Math.min(cycleElapsed / cycleDuration, 1)

  if (ringEl.value) {
    ringEl.value.style.strokeDashoffset = CIRCUMFERENCE * (1 - cycleProgress)
  }

  if (leadingDotEl.value) {
    const angle = -Math.PI / 2 + cycleProgress * 2 * Math.PI
    leadingDotEl.value.setAttribute('cx', 150 + RING_RADIUS * Math.cos(angle))
    leadingDotEl.value.setAttribute('cy', 150 + RING_RADIUS * Math.sin(angle))
  }

  phaseName.value = phase.name

  if (sessionElapsed.value >= totalSeconds.value) {
    end()
    return
  }

  rafId = requestAnimationFrame(tick)
}

async function start() {
  phaseIndex.value    = 0
  phaseElapsed.value  = 0
  sessionElapsed.value = 0
  cycleCount.value    = 0
  lastTs              = null
  phaseName.value     = pattern.value.phases[0].name
  breathState.active  = true
  breathState.cycleCount = 0
  breathState.scale   = 0.65
  screen.value        = 'session'

  try { wakeLock = await navigator.wakeLock?.request('screen') } catch {}

  audioManager.play(`/audio/${selectedAudio.value}.wav`)
  rafId = requestAnimationFrame(tick)
}

function end() {
  cancelAnimationFrame(rafId)
  rafId = null
  wakeLock?.release()
  wakeLock = null
  breathState.active = false
  audioManager.stop()
  screen.value = 'complete'
}

function reset() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
  wakeLock?.release()
  wakeLock = null
  breathState.active = false
  audioManager.stop()
  screen.value = 'setup'
}

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  wakeLock?.release()
})
</script>

<template>
  <div class="breathwork" :class="{ 'bg-solid': screen !== 'session' }">

    <!-- ── Setup ── -->
    <div v-if="screen === 'setup'" class="setup">
      <div class="brand">
        <h1>Spurs Zen</h1>
        <p class="tagline">Spirare est facere</p>
      </div>

      <section class="section">
        <h2 class="section-label">Choose a pattern</h2>
        <div class="pattern-list">
          <button
            v-for="(p, key) in PATTERNS"
            :key="key"
            class="pattern-card"
            :class="{ selected: selectedPattern === key }"
            @click="selectedPattern = key"
          >
            <span class="pattern-name">{{ p.label }}</span>
            <span class="pattern-desc">{{ p.description }}</span>
          </button>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Session length</h2>
        <div class="duration-row">
          <button
            v-for="d in SESSION_DURATIONS"
            :key="d.value"
            class="duration-btn"
            :class="{ selected: selectedDuration === d.value }"
            @click="selectedDuration = d.value"
          >
            {{ d.label }}
          </button>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">Choose your sound</h2>
        <div class="duration-row">
          <button
            class="duration-btn"
            :class="{ selected: selectedAudio === 'waves' }"
            @click="selectedAudio = 'waves'"
          >🌊 Ocean waves</button>
          <button
            class="duration-btn"
            :class="{ selected: selectedAudio === 'crowd' }"
            @click="selectedAudio = 'crowd'"
          >🏟 Stadium crowd</button>
        </div>
      </section>

      <button class="primary-btn" @click="start">Start</button>
    </div>

    <!-- ── Session ── -->
    <div v-else-if="screen === 'session'" class="session">
      <div class="ring-area">
        <svg class="ring-svg" viewBox="0 0 300 300" aria-hidden="true">
          <!-- Track -->
          <circle
            cx="150" cy="150" :r="RING_RADIUS"
            fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"
          />
          <!-- Progress arc -->
          <circle
            ref="ringEl"
            cx="150" cy="150" :r="RING_RADIUS"
            fill="none"
            stroke="#4ADE80"
            stroke-width="2"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="CIRCUMFERENCE"
            transform="rotate(-90 150 150)"
          />
          <!-- Phase boundary dots -->
          <circle
            v-for="(mark, i) in tickMarks"
            :key="i"
            :cx="mark.cx" :cy="mark.cy"
            r="5"
            fill="white"
          />
          <!-- Leading edge dot -->
          <circle
            ref="leadingDotEl"
            :cx="150"
            :cy="150 - RING_RADIUS"
            r="6"
            fill="#4ADE80"
          />
        </svg>
        <p class="phase-label">{{ phaseName }}</p>
      </div>

      <div class="volume-row">
        <span class="volume-icon">🔈</span>
        <input
          type="range" min="0" max="1" step="0.01"
          :value="volume"
          class="volume-slider"
          @input="e => { volume = +e.target.value; audioManager.setVolume(volume) }"
        />
        <span class="volume-icon">🔊</span>
      </div>

      <button class="exit-btn" @click="reset">Exit</button>
    </div>

    <!-- ── Complete ── -->
    <div v-else class="complete">
      <div class="complete-glyph">✦</div>
      <h2>Session complete</h2>
      <p class="complete-stat">
        {{ cycleCount }} breath cycle{{ cycleCount !== 1 ? 's' : '' }}
      </p>
      <button class="primary-btn" @click="reset">Done</button>
    </div>

  </div>
</template>

<style scoped>
/* ── Root ── */
.breathwork {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.breathwork.bg-solid {
  background: #0b1733;
}

/* ── Setup ── */
.setup {
  width: 100%;
  max-width: 420px;
  padding: 56px 24px 48px;
  padding-top: max(56px, env(safe-area-inset-top, 56px));
  display: flex;
  flex-direction: column;
  gap: 40px;
  box-sizing: border-box;
}

.brand {
  text-align: center;
}

.brand h1 {
  font-size: 36px;
  font-weight: 500;
  letter-spacing: -0.5px;
  color: #fff;
  margin: 0 0 8px;
}

.tagline {
  font-size: 15px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 12px;
}

.pattern-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pattern-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px 18px;
  min-height: 64px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.pattern-card.selected {
  border-color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
}

.pattern-name {
  font-size: 16px;
  font-weight: 700;
}

.pattern-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

.duration-row {
  display: flex;
  gap: 10px;
}

.duration-btn {
  flex: 1;
  padding: 14px 0;
  min-height: 50px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}

.duration-btn.selected {
  border-color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.primary-btn {
  width: 100%;
  padding: 18px;
  min-height: 56px;
  border-radius: 14px;
  border: none;
  background: #fff;
  color: #0b1733;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.primary-btn:active {
  opacity: 0.85;
}

/* ── Session ── */
.session {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.ring-svg {
  width: min(280px, 82vw);
  height: min(280px, 82vw);
  overflow: visible;
}

.phase-label {
  font-size: 20px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.03em;
  margin: 0;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(280px, 82vw);
}

.volume-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.volume-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.25);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: none;
  cursor: pointer;
}

.exit-btn {
  position: fixed;
  bottom: max(32px, env(safe-area-inset-bottom, 32px));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 372px;
  padding: 17px;
  border-radius: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  background: rgba(11, 23, 51, 0.3);
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s;
}

.exit-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

/* ── Complete ── */
.complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  max-width: 320px;
}

.complete-glyph {
  font-size: 28px;
  color: #4ADE80;
  margin-bottom: 12px;
}

.complete h2 {
  font-size: 28px;
  font-weight: 500;
  color: #fff;
  margin: 0;
}

.complete-stat {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.38);
  margin: 0 0 28px;
}
</style>
