# Spurs Zen — Design Document
---

## Overview

**Project Name:** Spurs Zen (working title)
**Platform:** Mobile-first progressive web app (PWA) — no install required
**Target Audience:** Tottenham Hotspur supporters seeking mindfulness, stress relief, and a deeper emotional connection with the club
**Nature:** Fan-made, not for profit
**Tagline:** *To breathe is to do.*

---

## Vision & Goals

Spurs Zen is a fan-made, not-for-profit website built out of love for the club. It combines the proven benefits of guided meditation with the passion and identity of being a Spurs supporter — creating a free, open space where fans can decompress after a tough match, build mental resilience, and reconnect with why they love the club.

**Primary Goals:**
- Provide a genuine, effective meditation and breathwork experience
- Leverage club identity (players, sounds, moments) as emotional anchors
- Build something meaningful for the supporter community
- Be freely accessible to any fan, anywhere, on their phone

---

## Core Features

### 1. Breathwork Animation

An interactive, visually guided breathing exercise that forms the heart of every session.

**Functionality:**
- Animated visual cue (expanding/contracting circle in club colors — navy, white, and electric blue) guides inhale, hold, and exhale cycles
- Multiple breathwork patterns available:
  - **4-7-8** — for post-match anxiety relief
  - **Box Breathing (4-4-4-4)** — for focus and pre-match nerves
  - **Resonance Breathing (5-5)** — for deep calm
- Session lengths: 3 min / 5 min / 10 min
- Progress ring tracks completion of each breath cycle
- Screen stays awake during sessions

**Design Considerations:**
- Animation should feel premium and meditative, not gamified
- Colors drawn strictly from club palette to reinforce brand identity
- Dark mode default to reduce visual stimulation during sessions
- Touch-friendly controls sized for thumbs; no hover-dependent UI
- Works entirely in-browser — no install required

---

### 2. Soothing Soundtrack

A layered, dynamic audio experience that blends nature sounds with iconic Spurs audio.

**Audio Layers:**

| Layer | Description | Toggle |
|---|---|---|
| Ambient Base | Ocean waves, light rain, or wind | Always on |
| Team Highlights | Softly mixed audio clips from legendary goals and commentary moments | Optional |
| Fan Chants | Crowd chants and terrace songs faded low as a background texture | Optional |

**Highlight Audio Candidates:**
- Goals from Kane, Son, Bale, Moura — including the iconic Lucas Moura Champions League semi-final hat-trick
- Eriksen through-balls, Defoe poacher finishes, van der Vaart rockets
- The roar of the Tottenham Hotspur Stadium crowd

**Audio Design Notes:**
- Highlight audio should be subtly mixed — recognizable but not jarring
- Chants should be processed and softened (reverb, EQ) to feel like a distant memory, not a stadium
- All audio layers must fade gracefully when session ends
- Use the Web Audio API for layered mixing directly in the browser
- Fan-recorded chants and freely licensed crowd ambience preferred where possible

---

### 3. Player Gallery — Fading Memories

A visual meditation backdrop featuring beloved Spurs players fading softly in and out during sessions.

**Featured Players (Launch Roster):**

| Player | Era | Why They're Included |
|---|---|---|
| **Harry Kane** | 2009–2023 | All-time club top scorer; the great what-if |
| **Son Heung-min** | 2015–present | Fan favourite; club captain; pure joy |
| **Gareth Bale** | 2007–2013 / 2020–21 | Generational talent; defining Spurs years |
| **Lucas Moura** | 2018–2023 | Amsterdam. Need we say more. |
| **Ledley King** | 1999–2012 | One-club man; greatest CB in club history |
| **Christian Eriksen** | 2013–2020 | The most creative Spur of his generation; his story carries deep emotion |
| **Hugo Lloris** | 2012–2023 | Club captain for over a decade; the face of the best Spurs years |
| **Luka Modrić** | 2008–2012 | Brief but magical; still remembered with enormous fondness |
| **Jermain Defoe** | 2004–2008 / 2009–2014 | Cult hero; two stints; goals and heart |
| **Rafael van der Vaart** | 2010–2012 | Fan favourite; technically brilliant; pure Redknapp-era magic |

**Technical Specifications:**
- Images displayed as full-bleed, softly blurred backgrounds using CSS `backdrop-filter`
- Ken Burns-style pan and zoom on each photo via CSS animations (slow, 20–30 second transitions)
- Crossfade dissolve between players using CSS opacity transitions (3–5 seconds)
- Sepia or desaturated processing via CSS `filter` to reduce visual stimulation and reinforce nostalgic mood
- All images lazy-loaded for mobile performance

**Image Sourcing Notes (Fan Project):**
- Seek Creative Commons licensed photos on Wikimedia Commons for prototyping
- Fan-submitted photography (e.g. from the terraces) may be usable with photographer permission
- Avoid screenshots of broadcast footage — copyright risk even for non-commercial projects

---

## Technical Architecture (High-Level)

```
Frontend (Mobile-First PWA)
├── HTML / CSS / Vanilla JS or lightweight framework (e.g. Svelte)
├── Breathwork Engine — CSS animation loop, Web Audio API sync, timer
├── Audio Manager — layered mixing via Web Audio API, fade control
├── Gallery Module — CSS Ken Burns, crossfade transitions
└── Session Manager — session state

Hosting
├── Static site hosting — Vercel
└── No backend required for MVP — everything runs client-side

PWA Features
├── Service Worker — offline support for ambient audio and core UI
├── Web App Manifest — "Add to Home Screen" support
└── Wake Lock API — keeps screen on during sessions
```

---

## Mobile-First Design Principles

Since this is a phone-first experience, the following constraints apply throughout:

- **Single column layout** — no sidebars, no desktop-first grids
- **Minimum 44px touch targets** — all buttons and controls
- **No hover states as primary interactions** — everything must work on tap
- **Portrait orientation primary** — landscape is a graceful fallback
- **Performance budget** — initial load under 200KB JS; images lazy-loaded; audio streamed not preloaded
- **Safe area awareness** — respect iOS notch and home bar with `env(safe-area-inset-*)`

---

## Design Language

| Element | Direction |
|---|---|
| **Color Palette** | Navy (#132257), white, and electric blue (#5AC0E8) accents |
| **Typography** | Clean sans-serif; generous line spacing for calm readability |
| **Motion** | Slow, deliberate, smooth — nothing snappy or jarring |
| **Tone of Voice** | Warm, understated, quietly proud — like a Spurs fan who's seen it all |
| **Imagery** | Nostalgic, filmic, slightly desaturated — evoking memory, not hype |

---

## Rights & Fan Project Considerations

As a not-for-profit fan project, the rights picture is more forgiving than a commercial product — but not without limits.

- **Player imagery** — non-commercial fan use of publicly available photos is generally lower risk; seek Creative Commons sources and fan photography where possible; avoid official club press photos
- **Club branding** — use club colors and aesthetic freely; avoid directly reproducing the registered Cockerel badge or official wordmark
- **Match audio** — broadcast footage clips remain the property of rightsholders regardless of commercial intent; fan-recorded chants and ambient crowd audio are safer
- **Transparency** — clearly label the site as an unofficial fan project with no affiliation to THFC; include a simple disclaimer in the footer

---

*Document version 0.2 — Last updated April 2026 — Unofficial fan project, not affiliated with Tottenham Hotspur FC*