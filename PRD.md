# PRD — SpineFlow: daily functional-movement training for low back pain

**Owner:** Gaurav · **Status:** v1 built · **Date:** 2026-11-22

> SpineFlow uses general functional-movement and back-rehab ideas (McGill "Big 3", McKenzie-style extension,
> neural mobilisation, hip-hinge patterning). It is **not** affiliated with the trademarked "Functional Patterns®"
> system, and it is **not** medical advice. Leg-radiating pain should be assessed by a physiotherapist or doctor.

---

## 1. Problem

- Recurring **lower back pain that sometimes radiates into the left leg** (sciatica-like symptoms).
- Already training in the gym, but gym work alone hasn't fixed it. What's missing is **frequent, low-dose, targeted
  movement**: calming the irritated nerve, building core endurance, and restoring hip and spine mobility.
- Long rehab sessions get skipped. The training has to be **small enough to do any time, anywhere** (desk, home,
  between gym sets) so that it becomes a daily habit.

## 2. Goals

| # | Goal | How we measure it |
|---|------|-------------------|
| G1 | Reduce back and leg pain | Daily 0–10 check-in for back and leg pain; trend going down over 4–8 weeks |
| G2 | Centralise leg symptoms (pain moving up from the leg toward the back is a good sign) | "How far down the leg?" check-in trend |
| G3 | Build a daily habit | Streak, sessions per week (target ≥ 5), and how fast a session can be started (≤ 2 taps) |
| G4 | Prevent future problems | Mobility and flexibility work in every session, and progression into loaded functional patterns |

**Non-goals (v1):** diagnosis, accounts or cloud sync, social features, video content, App Store distribution.

## 3. User and context

- One user (me) on an iPhone, sometimes at a desk, at home, or in the gym.
- Time available: **2, 5, 10 or 20 minutes**.
- Location and equipment: **Anywhere** (standing or a chair only, office-friendly), **Floor** (mat or carpet),
  **Gym** (resistance band or cable, a dumbbell or kettlebell).

## 4. Product principles

1. **Safety first.** A red-flag screen at onboarding, and sessions adapt when pain is high. "This hurts" always skips
   the exercise and flags it.
2. **Two taps to train.** Open the app, tap "Start", and the session follows the time and place you used last.
3. **Explain the why.** Every exercise shows its *objective*, *target muscles* (highlighted on the animated figure),
   and 2–4 coaching cues.
4. **Animated, not static.** Each exercise has a looping, keyframed body animation that also sets the rep tempo.
5. **Free and offline.** Static PWA on free hosting, installed to the iPhone Home Screen, fully offline, data stays
   on the device.

## 5. Training model

Four pillars. Every session draws from them according to the current phase.

| Pillar | Purpose | Examples |
|---|---|---|
| **Relieve** | Calm the nerve, reduce sensitivity, centralise symptoms | Seated sciatic nerve floss, supine nerve glide, prone press-up, standing extension, cat–camel, 90/90 breathing |
| **Stabilise** | Core endurance and spine stiffness without load (McGill) | McGill curl-up, side plank, bird dog, dead bug, glute bridge, Pallof press |
| **Strengthen** | Functional patterns: hinge, squat, lunge, carry, gait | Hip hinge, sit-to-stand, split squat, single-leg RDL, suitcase carry, brisk walk |
| **Mobilise** | Flexibility and joint health for prevention | Half-kneeling hip-flexor stretch, seated figure-4, open book, wall angel, supported deep squat |

### Phases (progress automatically, can be overridden)

| Phase | When | Mix |
|---|---|---|
| 1 · Calm | First 10 sessions, **or** any day with back pain ≥ 6 or leg pain ≥ 5 | Mostly Relieve, plus gentle Mobilise |
| 2 · Stabilise | Sessions 11–30 | Relieve warm-up, McGill Big 3 core, plus Mobilise |
| 3 · Build | Sessions 31+ | Short warm-up, Stabilise maintenance, Strengthen patterns, plus Mobilise |

### Adaptation rules

- **High pain day** (back ≥ 6 or leg ≥ 5): run a Phase 1 session no matter which phase you are in.
- **Exercise flagged "This hurts"**: left out of auto-built sessions for 7 days. You can un-flag it in the Library.
- **Symptoms spreading further down the leg** compared with yesterday's check-in: show a caution banner, run a
  Calm-only session, and suggest seeing a physio if it lasts more than a few days.
- **Variety**: Mobilise slots rotate by date, so sessions don't feel identical.

## 6. Features (v1 scope)

### F1 Onboarding and safety
- Red-flag checklist: loss of bladder or bowel control, numbness in the saddle area, progressive leg weakness or
  foot drop, fever or unexplained weight loss, severe pain after trauma. Any "yes" shows a "seek medical care now"
  screen.
- Choose the side the leg symptoms are on (left, right or both), used for nerve-glide side emphasis.

### F2 Home (Today)
- Daily check-in: back pain 0–10, leg pain 0–10, and how far down the leg (none, buttock, thigh, below knee, foot).
- Quick-start chips for **time** (2/5/10/20 min) and **place** (Anywhere/Floor/Gym). The choice is remembered.
- A preview of the generated session (exercises and estimated minutes) and a big **Start** button.
- Streak, phase badge and the week's dots.

### F3 Session player
- Full-screen animated figure. Target muscles are highlighted in the accent colour.
- Rep counter synced to the animation loop (one loop = one rep), or a countdown ring for holds.
- Side handling: the figure mirrors and the app announces "Switch sides".
- Objective, muscles and rotating cues on screen. Optional voice coaching (Web Speech API).
- Controls: pause/play, back, skip, **This hurts** (skips and flags the exercise).
- Rest screen with an "Up next" preview. Screen kept awake with the Wake Lock API.
- End screen: "Compared with before: Better / Same / Worse", saved to the log.

### F4 Library
- All exercises, filterable by pillar and place. A detail view shows the animation, objective, muscles, cues,
  mistakes to avoid, a safety note, and a "Practice" button for a single-exercise session.
- **Video guide:**
  - Each exercise links to a curated YouTube search, which opens the YouTube app.
  - You can pin a video you like by pasting its link. The pinned video then plays embedded, full-screen on iPhone,
    with an "Open in YouTube app" button.
  - In the session player, a "▶ Video" button pauses the session and opens the video.
  - Videos use search links rather than hard-coded IDs, so a deleted video can never break the app.

### F5 Progress
- Streak, total sessions and total minutes.
- 35-day activity heatmap.
- Pain trend chart (back and leg) and a leg-symptom level chart.

### F6 Settings
- Phase (Auto or a fixed phase), voice on/off, symptom side.
- **Daily reminder:** generates a recurring `.ics` calendar event at the time you choose (iOS Calendar handles
  the alert, so no push server is needed).
- Export and import data as JSON, and a reset option.

## 7. Technical design

| Concern | Decision | Why |
|---|---|---|
| Platform | **PWA** (HTML, CSS, vanilla JS ES modules, no build step) | Installs to the iPhone Home Screen for free, with no Apple developer fee |
| Animation | Custom SVG **forward-kinematics figure**: poses are joint angles, keyframes are interpolated with easing, and the spine can curve | Smooth, tiny (no video), and each exercise defines its own tempo and highlighted muscles |
| Storage | `localStorage` (versioned JSON), with export and import | Offline, private, nothing to set up |
| Offline | Service worker that caches every app file first (cache-first) | Works in the gym basement |
| Voice | `speechSynthesis` | Built into iOS Safari |
| Keep awake | `navigator.wakeLock` | Supported in iOS 16.4+ |
| Reminders | Generated `.ics` file with `RRULE:FREQ=DAILY` | iOS web push needs a server, so the calendar handles reminders |
| Hosting | GitHub Pages, Netlify or Cloudflare Pages (any static host) | Free, HTTPS (which a PWA requires) |

### Code layout
```
index.html            app shell, tab bar
css/styles.css        design tokens, mobile-first, safe-area insets
js/app.js             router, views (home, library, detail, progress, settings, onboarding)
js/player.js          session player state machine
js/figure.js          SVG skeletal animation engine
js/exercises.js       exercise data: keyframes, dose, muscles, cues
js/program.js         phase logic and session builder
js/store.js           persistence, streaks, check-ins
js/charts.js          small SVG charts
sw.js                 service worker
manifest.webmanifest  PWA manifest
icons/                app icons
```

## 8. Acceptance criteria

- [ ] Installs to the iPhone Home Screen and opens full-screen, with no browser chrome. *(manifest and meta tags in
      place; needs testing on a device after deploy)*
- [ ] Works in airplane mode after the first load. *(service worker caches every app file first; needs testing on a
      device)*
- [x] From a cold open to a running session takes ≤ 2 taps (open the app, tap Start).
- [x] Every exercise has a looping animation, an objective, target muscles and cues (24 exercises).
- [x] 2-, 5-, 10- and 20-minute sessions come within ±25% of the target time, checked by simulating every
      combination of phase, place and duration.
- [x] A high pain check-in switches the session to the Calm phase.
- [x] "This hurts" skips the exercise and leaves it out of auto sessions for 7 days.
- [x] Data survives app restarts (localStorage). Export and import of the JSON backup is implemented.

## 9. Future (v2+)

- Optional iCloud or Supabase sync. Apple Health "mindful minutes" through a native wrapper (Capacitor).
- A Capacitor iOS build for local notifications (needs a free Apple ID for personal sideloading, re-signed every
  7 days).
- More exercises, video demos, and progressions driven by RPE.
