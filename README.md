# SpineFlow

Daily functional-movement training for low back pain (with or without sciatica-like leg symptoms).
It's a free, offline PWA with no build step, no account and no backend. See [PRD.md](PRD.md) for the product spec.

## Run locally

```bash
cd functional-patterns
python3 -m http.server 8000        # or: npx serve .
# open http://localhost:8000
```

ES modules and the service worker need `http://`, so opening `index.html` as a file won't work.

To test on your iPhone over Wi-Fi, open `http://<your-mac-ip>:8000` in Safari. The service worker and the
"Add to Home Screen" offline mode need **HTTPS**, so for the real install, deploy it as described below.

## Deploy (free, about 2 minutes)

The app is just static files. Pick one option:

**A. Netlify Drop (easiest, no git):**
go to https://app.netlify.com/drop, drag the `functional-patterns` folder in, and you get an HTTPS URL.

**B. GitHub Pages:**
```bash
git init && git add . && git commit -m "SpineFlow v1"
gh repo create spineflow --public --source . --push
gh api repos/{owner}/spineflow/pages -X POST -f "source[branch]=main" -f "source[path]=/"
# the app is then live at https://<user>.github.io/spineflow/
```

**C. Cloudflare Pages or Vercel:** point either at the repo. There's no build command, and the output directory is `/`.

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Launch it from the Home Screen. It runs full-screen and keeps working offline.
4. Optional: in **Settings → Daily reminder**, tap **Add** to put a repeating reminder event in iOS Calendar.

Your data stays in the phone's local storage. Use **Settings → Export** for backups.

## Updating

After you change any app file, bump `VERSION` in `sw.js` (for example to `spineflow-v2`) so installed copies pick up
the new files. Then redeploy.

## Project layout

| Path | What it does |
|---|---|
| `js/figure.js` | SVG skeletal animation engine: joint-angle poses, 2-bone IK for planted hands and feet, eased keyframes, auto-framing, mirroring for left/right sides |
| `js/exercises.js` | The 24 exercises: keyframes, dose, objective, target muscles (highlighted on the figure), cues, mistakes, safety notes |
| `js/program.js` | Phases (Calm → Stabilise → Build), pain-adaptive rules, time-boxed session builder |
| `js/player.js` | Guided session player: rep counter synced to the animation, hold timers, voice, wake lock, "This hurts" |
| `js/app.js` | Router and views: onboarding/safety screen, Today, Library, Detail, Progress, Settings |
| `js/store.js` | localStorage persistence, streaks, check-ins |
| `js/charts.js` | Pain trend line chart and activity heatmap (SVG) |
| `dev/` | Dev-only tools: pose sheet (`poses.html`), demo-data seeder (`shot.html`), phone frame, icon generator. Not needed in production. |

### Adding an exercise

Add an entry to `EXERCISES` in `js/exercises.js`, then check its animation in `dev/poses.html?only=<id>`
(it shows 4 phases of the loop). Angles are in degrees: 0 = down, 90 = forward, 180 = up. Use `L1`/`A1` IK targets
to pin feet or hands to the floor. To have the session builder use the exercise, add its id to a `PRIORITY` or
`MOBILITY` list in `js/program.js`.

## Safety

SpineFlow is a general exercise guide, not medical advice. Leg pain that keeps spreading, new weakness or numbness,
or any bladder or bowel change needs a clinician.
# fix-backpain
