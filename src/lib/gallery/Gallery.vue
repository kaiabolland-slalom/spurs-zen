<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { breathState } from '../session/breathState.js'

const PLAYERS = [
  { src: new URL('../../assets/images/players/Harry_Kane_(24685589756).jpg',                                                          import.meta.url).href },
  { src: new URL('../../assets/images/players/Titan_Sports_Conferred_the_trophy_to_Son_Heung-min_on_April_24th,_2018.jpg',            import.meta.url).href },
  { src: new URL('../../assets/images/players/gareth-bale.jpg',                                                                       import.meta.url).href },
  { src: new URL('../../assets/images/players/lucas-moura.jpg',                                                                       import.meta.url).href },
  { src: new URL('../../assets/images/players/christian-eriksen.jpg',                                                                 import.meta.url).href },
  { src: new URL('../../assets/images/players/Manchester_United_v_Tottenham_Hotspur,_December_2016_(08).jpeg',                        import.meta.url).href },
  { src: new URL('../../assets/images/players/luka-modric.jpg',                                                                       import.meta.url).href },
  { src: new URL('../../assets/images/players/jermain-defoe.jpg',                                                                     import.meta.url).href },
  { src: new URL('../../assets/images/players/rafael-van-der-vaart.jpg',                                                              import.meta.url).href },
  { src: new URL('../../assets/images/players/Tottenham_Hotspur_Stadium_South_Stand.jpg',                                             import.meta.url).href },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let deck = shuffle(PLAYERS)
let deckPos = 0
function draw() {
  if (deckPos >= deck.length) { deck = shuffle(PLAYERS); deckPos = 0 }
  return deck[deckPos++]
}

// Two slots that crossfade — we alternate which is visible
const slots = ref([
  { src: draw().src, visible: true  },
  { src: draw().src, visible: false },
])
let activeSlot = 0
let lastCycleCount = -1   // -1 so the first cycle triggers a photo advance

// Gallery maintains its own zoom that lerps toward a target — never snaps, so
// phase transitions are always smooth.
let galleryZoom   = 1.0
let lastPhaseDir  = 1    // +1 or -1, remembers direction before a hold

// Direct DOM refs for the zoom layer inside each slot
const zoomEls = [null, null]

let rafId = null

function tick() {
  let zoomTarget
  let lerpSpeed

  if (breathState.phaseDir !== 0) {
    // Active breath: target is where breathState.scale maps on the zoom range
    const t = Math.max(0, Math.min(1, (breathState.scale - 0.65) / 0.35))
    zoomTarget   = 1.0 + t * 0.12
    lerpSpeed    = 0.10   // responsive — tracks breath over a 4–5 s phase
    lastPhaseDir = breathState.phaseDir
  } else {
    // Hold: target drifts slowly past current position in the last direction
    zoomTarget = galleryZoom + lastPhaseDir * 0.06
    zoomTarget = Math.max(0.97, Math.min(1.15, zoomTarget))
    lerpSpeed  = 0.006  // ~10× slower — barely perceptible drift
  }

  galleryZoom += (zoomTarget - galleryZoom) * lerpSpeed
  galleryZoom  = Math.max(0.97, Math.min(1.15, galleryZoom))

  for (let i = 0; i < 2; i++) {
    if (zoomEls[i]) zoomEls[i].style.transform = `scale(${galleryZoom})`
  }

  // Advance photo on each new breath cycle (only while a session is running)
  if (breathState.active && breathState.cycleCount !== lastCycleCount) {
    lastCycleCount = breathState.cycleCount
    const next = 1 - activeSlot
    slots.value[next].src = draw().src
    slots.value[next].visible = true
    slots.value[activeSlot].visible = false
    activeSlot = next
  }

  rafId = requestAnimationFrame(tick)
}

onMounted(() => { rafId = requestAnimationFrame(tick) })
onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId) })
</script>

<template>
  <div class="gallery" aria-hidden="true">
    <div
      v-for="(slot, i) in slots"
      :key="`slot-${i}`"
      class="gallery-slot"
      :class="{ 'is-visible': slot.visible }"
    >
      <div
        :ref="el => zoomEls[i] = el"
        class="gallery-zoom"
        :style="{ backgroundImage: `url(${slot.src})` }"
      />
    </div>
    <div class="gallery-overlay" />
  </div>
</template>

<style scoped>
.gallery {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.gallery-slot {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 2s ease-in-out;
}

.gallery-slot.is-visible {
  opacity: 1;
}

.gallery-zoom {
  position: absolute;
  inset: -8%;
  background-size: cover;
  background-position: center top;
  filter: sepia(0.15) saturate(0.8) brightness(0.58);
  will-change: transform;
  transform-origin: center 20%;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(19, 34, 87, 0.48);
}
</style>
