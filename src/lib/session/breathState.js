// Plain mutable object — written by BreathworkEngine every rAF frame,
// read by Gallery. No Vue reactivity overhead on the hot path.
export const breathState = {
  scale: 0.65,    // mirrors the breath circle scale (0.65 exhaled → 1.0 inhaled)
  cycleCount: 0,
  active: false,
  phaseDir: 0,    // +1 = inhaling, -1 = exhaling, 0 = hold
}
