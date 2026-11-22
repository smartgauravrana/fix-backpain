import { EXERCISES, BY_ID, PILLARS, PLACES, ytSearchUrl, ytWatchUrl, ytEmbedUrl, parseYouTubeId } from './exercises.js';
import { createFigure, autoplay } from './figure.js';
import { store, dayKey, addDays, streak, bestStreak, todayCheckin, sessionDays, isFlagged } from './store.js';
import { PHASES, todayStatus, autoPhase, buildSession, sessionSecs, doseLabel, itemSecs, TIPS } from './program.js';
import { runSession } from './player.js';
import { lineChart, heatmap } from './charts.js';
import { icon, toast, esc } from './ui.js';

const app = document.getElementById('app');
let cleanups = [];
const onCleanup = f => cleanups.push(f);
const $ = (sel, r = app) => r.querySelector(sel);
const $$ = (sel, r = app) => [...r.querySelectorAll(sel)];

const LEVELS = ['None', 'Buttock', 'Thigh', 'Below knee', 'Foot'];
const MINUTES = [2, 5, 10, 20];
const RED_FLAGS = [
  'Loss of bladder or bowel control, or new difficulty urinating',
  'Numbness in the groin, genitals or inner thighs ("saddle" area)',
  'Leg weakness that is getting worse, or foot drop (toes catching)',
  'Fever, unexplained weight loss, or a history of cancer',
  'Severe pain after a fall or accident, or pain that is constant and worse at night',
];

// ---------- helpers ----------
function staticFigure(ex, mirror = false) {
  const f = createFigure(ex);
  f.setMirror(mirror);
  f.draw(f.timeline.peak);
  return f.svg;
}
function mount(sel, node) { const host = $(sel); if (host) host.append(node); }
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
const fmtMin = secs => `${Math.max(1, Math.round(secs / 60))} min`;

// ---------- router ----------
function route() {
  cleanups.forEach(f => f()); cleanups = [];
  const s = store.get();
  const tabbar = document.querySelector('.tabbar');
  if (!s.onboarded) { tabbar.classList.add('hidden'); return renderOnboarding(); }
  tabbar.classList.remove('hidden');
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, arg] = hash.split('/');
  const tab = name === 'ex' ? 'library' : (name || 'home');
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  window.scrollTo(0, 0);
  if (name === 'library') return renderLibrary();
  if (name === 'ex') return renderDetail(arg);
  if (name === 'progress') return renderProgress();
  if (name === 'settings') return renderSettings();
  return renderHome();
}
window.addEventListener('hashchange', route);

// ---------- onboarding ----------
let obStep = 0;
function renderOnboarding() {
  const s = store.get();
  if (obStep === 0) {
    app.innerHTML = `
      <div class="view onboard">
        <div class="stack">
          <div class="detail-hero" id="ob-fig"></div>
          <p class="tiny" style="color:var(--accent)">SpineFlow</p>
          <h1>A few minutes a day for a calmer back.</h1>
          <p class="muted">Short sessions built around back-friendly movement: nerve glides, McGill core work, hip hinging and mobility. Do them at your desk, at home or between sets at the gym.</p>
          <div class="card flat stack small">
            <div class="row"><span class="tag" style="color:var(--p-relieve)"><span class="dot"></span>Relieve</span><span class="muted">calm the nerve and centralise leg pain</span></div>
            <div class="row"><span class="tag" style="color:var(--p-stabilize)"><span class="dot"></span>Stabilise</span><span class="muted">core endurance that protects the spine</span></div>
            <div class="row"><span class="tag" style="color:var(--p-strengthen)"><span class="dot"></span>Strengthen</span><span class="muted">hinge, squat, lunge, carry</span></div>
            <div class="row"><span class="tag" style="color:var(--p-mobilize)"><span class="dot"></span>Mobilise</span><span class="muted">flexibility for long-term prevention</span></div>
          </div>
        </div>
        <button class="btn primary block big" id="go" style="margin-top:20px">Get started</button>
      </div>`;
    const f = createFigure(BY_ID['bird-dog']);
    mount('#ob-fig', f.svg); onCleanup(autoplay(f));
    $('#go').onclick = () => { obStep = 1; route(); };
  } else if (obStep === 1) {
    app.innerHTML = `
      <div class="view onboard">
        <div class="stack">
          <p class="tiny" style="color:var(--warn)">Safety check</p>
          <h1>Do any of these apply to you right now?</h1>
          <div class="card"><ul class="flags">${RED_FLAGS.map(f => `<li>${f}</li>`).join('')}</ul></div>
          <p class="small muted">These are rare, but they need a doctor rather than exercise.</p>
        </div>
        <div class="stack" style="margin-top:20px">
          <button class="btn primary block big" id="none">None of these apply</button>
          <button class="btn block ghost" id="some">One or more apply</button>
        </div>
      </div>`;
    $('#none').onclick = () => { obStep = 2; route(); };
    $('#some').onclick = () => { obStep = 9; route(); };
  } else if (obStep === 9) {
    app.innerHTML = `
      <div class="view onboard">
        <div class="stack">
          <div class="banner" style="background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)">${icon('alert')}<div><b>Please get checked by a doctor first.</b></div></div>
          <h1>See a doctor before you start</h1>
          <p class="muted">Those symptoms can mean pressure on the nerves that control the bladder, bowels and legs. It needs prompt medical assessment. If you have bladder or bowel changes or saddle numbness, go to <b>urgent care or the emergency department today</b>.</p>
          <p class="muted">Once a clinician has cleared you for exercise, you can come back and continue.</p>
        </div>
        <div class="stack" style="margin-top:20px">
          <button class="btn block ghost" id="cleared">A clinician has cleared me — continue</button>
          <button class="btn block" id="back">Back</button>
        </div>
      </div>`;
    $('#cleared').onclick = () => { obStep = 2; route(); };
    $('#back').onclick = () => { obStep = 1; route(); };
  } else {
    app.innerHTML = `
      <div class="view onboard">
        <div class="stack">
          <p class="tiny" style="color:var(--accent)">About you</p>
          <h1>Which leg do the symptoms travel to?</h1>
          <div class="chips wrap" id="side">${['left', 'right', 'both', 'none'].map(v => `<button class="chip ${s.side === v ? 'on' : ''}" data-v="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>
          <p class="small muted">Nerve glides start on that side.</p>
          <h2 style="margin-top:18px">Where will you usually train?</h2>
          <div class="chips wrap" id="place">${Object.entries(PLACES).map(([k, p]) => `<button class="chip ${s.settings.place === k ? 'on' : ''}" data-v="${k}">${p.name}</button>`).join('')}</div>
          <p class="small muted" id="place-hint">${PLACES[s.settings.place].hint}</p>
          <h2 style="margin-top:18px">A typical session length</h2>
          <div class="chips" id="min">${MINUTES.map(m => `<button class="chip ${s.settings.minutes === m ? 'on' : ''}" data-v="${m}">${m} min</button>`).join('')}</div>
          <p class="small muted">You can change any of these before each session.</p>
        </div>
        <button class="btn primary block big" id="done" style="margin-top:20px">Start training</button>
      </div>`;
    const pick = (id, fn) => $$(`#${id} .chip`).forEach(b => b.onclick = () => { store.update(st => fn(st, b.dataset.v)); route(); });
    pick('side', (st, v) => { st.side = v; });
    pick('place', (st, v) => { st.settings.place = v; });
    pick('min', (st, v) => { st.settings.minutes = Number(v); });
    $('#done').onclick = () => { store.update(st => { st.onboarded = true; }); location.hash = '#/'; route(); };
  }
}

// ---------- home ----------
function renderHome() {
  const s = store.get();
  const st = todayStatus(s);
  const { minutes, place } = s.settings;
  const items = buildSession({ minutes, place, phase: st.phase });
  const est = sessionSecs(items);
  const ci = todayCheckin(s);
  const days = sessionDays(s);
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  const doneToday = days.has(dayKey());
  const str = streak(s);

  app.innerHTML = `
    <div class="view stack">
      <div class="hello">
        <div>
          <p class="muted small">${today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>${greeting()}</h1>
        </div>
        <div class="streak" title="Day streak">${icon('flame')}<span>${str}</span></div>
      </div>

      ${st.caution ? `<div class="banner">${icon('alert')}<div>${esc(st.caution)}</div></div>` : ''}

      <div class="card" id="checkin">
        ${ci && !renderHome.editCheckin ? `
          <div class="row between">
            <div>
              <p class="tiny muted">Today's check-in</p>
              <p style="font-weight:700;margin-top:2px">Back ${ci.back}/10 · Leg ${ci.leg}/10 · ${LEVELS[ci.level]}</p>
            </div>
            <button class="chip" id="edit-ci">Edit</button>
          </div>` : `
          <div class="row between" style="margin-bottom:6px"><h3>How's your back today?</h3><span class="small muted">10 s</span></div>
          <div class="slider-row"><span class="small">Back pain</span><span class="val" id="v-back">${ci?.back ?? 3}</span><input type="range" min="0" max="10" value="${ci?.back ?? 3}" id="r-back" aria-label="Back pain"></div>
          <div class="slider-row"><span class="small">Leg pain</span><span class="val" id="v-leg">${ci?.leg ?? 2}</span><input type="range" min="0" max="10" value="${ci?.leg ?? 2}" id="r-leg" aria-label="Leg pain"></div>
          <p class="small" style="margin:6px 0">How far down the leg does it go?</p>
          <div class="seg-ctl" id="lvl">${LEVELS.map((l, i) => `<button data-v="${i}" class="${(ci?.level ?? 0) === i ? 'on' : ''}">${l}</button>`).join('')}</div>
          <button class="btn primary block" id="save-ci" style="margin-top:12px">Save check-in</button>`}
      </div>

      <div class="card session-card">
        <div class="row between">
          <div>
            <p class="tiny" style="color:var(--accent)">Phase ${st.phase} · ${PHASES[st.phase].name}${st.calmDay && st.basePhase !== 1 ? ' (calm day)' : ''}</p>
            <h2 style="margin-top:2px">${doneToday ? 'Go again?' : "Today's session"}</h2>
          </div>
          <span class="tag">${icon('clock').replace('<svg', '<svg style="width:14px;height:14px"')}${fmtMin(est)}</span>
        </div>
        <p class="small muted" style="margin:4px 0 12px">${PHASES[st.phase].blurb}</p>
        <div class="chips" id="min" style="margin-bottom:8px">${MINUTES.map(m => `<button class="chip ${minutes === m ? 'on' : ''}" data-v="${m}">${m} min</button>`).join('')}</div>
        <div class="chips" id="place" style="margin-bottom:10px">${Object.entries(PLACES).map(([k, p]) => `<button class="chip ${place === k ? 'on' : ''}" data-v="${k}">${p.name}</button>`).join('')}</div>
        <ul class="session-list">
          ${items.map(it => {
            const ex = BY_ID[it.id];
            return `<li data-id="${ex.id}">
              <span class="pbar" style="background:${PILLARS[ex.pillar].color}"></span>
              <span class="thumb" data-thumb="${ex.id}"></span>
              <div class="grow"><div style="font-weight:600;font-size:15px">${esc(ex.name)}</div>
              <div class="small muted">${doseLabel(ex, it.sets, it.secs)} · ${esc(ex.muscles.slice(0, 2).join(', '))}</div></div>
            </li>`;
          }).join('')}
        </ul>
        <button class="btn primary block big" id="start" style="margin-top:12px">${icon('play')} Start · ${fmtMin(est)}</button>
      </div>

      <div class="card">
        <div class="row between" style="margin-bottom:8px"><h3>This week</h3><span class="small muted">${[...week].filter(d => days.has(dayKey(d))).length}/7 days</span></div>
        <div class="week">${week.map(d => {
          const k = dayKey(d);
          return `<div><div class="d">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div><div class="b ${days.has(k) ? 'done' : ''} ${k === dayKey() ? 'today' : ''}">${days.has(k) ? icon('check') : ''}</div></div>`;
        }).join('')}</div>
      </div>

      <div class="card flat"><p class="tiny muted" style="margin-bottom:4px">Tip of the day</p><p class="small">${esc(tip)}</p></div>
      <p class="small muted" style="text-align:center">SpineFlow is not medical advice. Get leg pain that keeps spreading, weakness or numbness checked by a clinician.</p>
    </div>`;

  $$('[data-thumb]').forEach(h => h.append(staticFigure(BY_ID[h.dataset.thumb])));
  $$('.session-list li').forEach(li => li.onclick = () => { location.hash = `#/ex/${li.dataset.id}`; });
  $$('#min .chip').forEach(b => b.onclick = () => { store.update(x => { x.settings.minutes = Number(b.dataset.v); }); route(); });
  $$('#place .chip').forEach(b => b.onclick = () => { store.update(x => { x.settings.place = b.dataset.v; }); route(); });
  $('#start').onclick = () => runSession({ items, phase: st.phase, place, onExit: () => route() });

  if ($('#edit-ci')) $('#edit-ci').onclick = () => { renderHome.editCheckin = true; route(); };
  if ($('#save-ci')) {
    let level = ci?.level ?? 0;
    const bind = k => { const r = $(`#r-${k}`); r.oninput = () => { $(`#v-${k}`).textContent = r.value; }; };
    bind('back'); bind('leg');
    $$('#lvl button').forEach(b => b.onclick = () => { level = Number(b.dataset.v); $$('#lvl button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#save-ci').onclick = () => {
      store.update(x => { x.checkins[dayKey()] = { back: Number($('#r-back').value), leg: Number($('#r-leg').value), level, ts: Date.now() }; });
      renderHome.editCheckin = false;
      toast('Check-in saved');
      route();
    };
  }
}

// ---------- library ----------
let libFilter = 'all';
function renderLibrary() {
  const list = EXERCISES.filter(e => libFilter === 'all' || e.pillar === libFilter);
  app.innerHTML = `
    <div class="view stack">
      <h1>Library</h1>
      <p class="muted small">${EXERCISES.length} exercises. Tap one to see how to do it, what it targets, and to practise it on its own.</p>
      <div class="chips" id="filter">
        <button class="chip ${libFilter === 'all' ? 'on' : ''}" data-v="all">All</button>
        ${Object.entries(PILLARS).map(([k, p]) => `<button class="chip ${libFilter === k ? 'on' : ''}" data-v="${k}">${p.name}</button>`).join('')}
      </div>
      ${libFilter !== 'all' ? `<p class="small muted">${PILLARS[libFilter].blurb}</p>` : ''}
      <div class="grid">
        ${list.map(ex => `
          <a class="card ex-card tap" href="#/ex/${ex.id}">
            <div class="fig-wrap" data-fig="${ex.id}"></div>
            <span class="tag" style="color:${PILLARS[ex.pillar].color};align-self:flex-start"><span class="dot"></span>${PILLARS[ex.pillar].name}</span>
            <h3>${esc(ex.name)}</h3>
            <span class="small muted">${PLACES[ex.place].name} · ${doseLabel(ex)}</span>
            ${isFlagged(ex.id) ? '<span class="flag">Paused: you flagged it as painful</span>' : ''}
          </a>`).join('')}
      </div>
    </div>`;
  $$('[data-fig]').forEach(h => h.append(staticFigure(BY_ID[h.dataset.fig])));
  $$('#filter .chip').forEach(b => b.onclick = () => { libFilter = b.dataset.v; route(); });
}

function renderDetail(id) {
  const ex = BY_ID[id];
  if (!ex) { location.hash = '#/library'; return; }
  const p = PILLARS[ex.pillar];
  const flagged = isFlagged(ex.id);
  app.innerHTML = `
    <div class="view stack">
      <a class="back-link" href="#/library">${icon('back')} Library</a>
      <div class="detail-hero" id="hero"></div>
      <div class="row wrap" style="gap:6px">
        <span class="tag" style="color:${p.color}"><span class="dot"></span>${p.name}</span>
        <span class="tag">${PLACES[ex.place].name}</span>
        <span class="tag">${esc(ex.equip)}</span>
        <span class="tag">${doseLabel(ex)}</span>
      </div>
      <h1>${esc(ex.name)}</h1>
      <div class="card">
        <p class="tiny muted" style="margin-bottom:4px">Objective</p>
        <p>${esc(ex.objective)}</p>
        <p class="tiny muted" style="margin:12px 0 6px">Target muscles <span style="color:var(--focus)">(highlighted)</span></p>
        <div class="row wrap" style="gap:6px">${ex.muscles.map(m => `<span class="tag muscle"><span class="dot"></span>${esc(m)}</span>`).join('')}</div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:4px">How to</h3>
        <ol class="cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
      </div>
      <div class="card" id="video"></div>
      <div class="card">
        <h3 style="margin-bottom:4px">Avoid</h3>
        <ul class="avoid small" style="padding-left:18px;margin:0">${ex.avoid.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <div class="banner" style="margin-top:12px">${icon('alert')}<div>${esc(ex.safety)}</div></div>
      </div>
      ${flagged ? `<button class="btn block ghost" id="unflag">Unpause: you flagged this as painful</button>` : ''}
      <button class="btn primary block big" id="practice">${icon('play')} Practise · ${fmtMin(itemSecs(ex, ex.dose.sets))}</button>
    </div>`;
  const f = createFigure(ex);
  mount('#hero', f.svg);
  onCleanup(autoplay(f));
  renderVideoCard(ex);
  $('#practice').onclick = () => runSession({
    items: [{ id: ex.id, sets: ex.dose.sets }], phase: todayStatus().phase, place: ex.place, onExit: () => route(),
  });
  if ($('#unflag')) $('#unflag').onclick = () => { store.update(s => { delete s.flags[ex.id]; }); toast('Back in your sessions'); route(); };
}

function renderVideoCard(ex) {
  const host = $('#video');
  const vid = store.get().videos?.[ex.id];
  const ext = 'target="_blank" rel="noopener"';
  if (vid) {
    host.innerHTML = `
      <div class="row between" style="margin-bottom:10px"><h3>Video guide</h3><button class="chip" id="v-change">Change</button></div>
      <div class="video-frame"><iframe src="${ytEmbedUrl(vid)}" title="${esc(ex.name)} video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <p class="small muted" style="margin:8px 0">Tap play. On iPhone it opens full-screen. Needs an internet connection.</p>
      <a class="btn block ghost" href="${ytWatchUrl(vid)}" ${ext}>${icon('play')} Open in YouTube app</a>`;
    $('#v-change').onclick = () => { store.update(s => { delete s.videos[ex.id]; }); renderVideoCard(ex); };
    return;
  }
  host.innerHTML = `
    <h3 style="margin-bottom:4px">Video guide</h3>
    <p class="small muted" style="margin-bottom:10px">See the movement explained in detail by a coach or physio. This opens the YouTube app.</p>
    <a class="btn block primary" href="${ytSearchUrl(ex)}" ${ext}>${icon('play')} Find videos on YouTube</a>
    <p class="small muted" style="margin:14px 0 6px">Found a good one? In YouTube tap <b>Share → Copy link</b>, then paste it here to pin it to this exercise:</p>
    <div class="row">
      <input class="text-input grow" id="v-url" type="url" inputmode="url" placeholder="https://youtu.be/…" autocomplete="off">
      <button class="btn" id="v-paste" style="height:44px;padding:0 14px;font-size:15px">Paste</button>
      <button class="btn primary" id="v-save" style="height:44px;padding:0 16px;font-size:15px">Pin</button>
    </div>`;
  const save = val => {
    const id = parseYouTubeId(val);
    if (!id) return toast('That doesn\'t look like a YouTube link');
    store.update(s => { (s.videos ||= {})[ex.id] = id; });
    toast('Video pinned'); renderVideoCard(ex);
  };
  $('#v-save').onclick = () => save($('#v-url').value);
  $('#v-url').onkeydown = e => { if (e.key === 'Enter') save(e.target.value); };
  const paste = $('#v-paste');
  if (!navigator.clipboard?.readText) paste.remove();
  else paste.onclick = async () => {
    try { const t = await navigator.clipboard.readText(); $('#v-url').value = t; save(t); }
    catch { toast('Allow paste, or long-press the box and tap Paste'); }
  };
}

// ---------- progress ----------
function renderProgress() {
  const s = store.get();
  const days = sessionDays(s);
  const totalMin = Math.round(s.sessions.reduce((t, x) => t + (x.secs || 0), 0) / 60);
  const N = 30;
  const keys = Array.from({ length: N }, (_, i) => dayKey(addDays(new Date(), i - N + 1)));
  const cis = keys.map(k => s.checkins[k] || null);
  const hasCi = cis.some(Boolean);
  const labels = keys.map(k => `${Number(k.slice(8))}`);
  const recent = [...s.sessions].reverse().slice(0, 8);
  const feelEmoji = { better: '😌', same: '😐', worse: '😣' };
  const last7 = keys.slice(-7).filter(k => days.has(k)).length;

  app.innerHTML = `
    <div class="view stack">
      <h1>Progress</h1>
      <div class="stats">
        <div class="card stat"><p class="tiny muted">Current streak</p><p class="num">${streak(s)}<span class="small muted"> days</span></p></div>
        <div class="card stat"><p class="tiny muted">Best streak</p><p class="num">${bestStreak(s)}<span class="small muted"> days</span></p></div>
        <div class="card stat"><p class="tiny muted">Sessions</p><p class="num">${s.sessions.length}</p></div>
        <div class="card stat"><p class="tiny muted">Minutes moved</p><p class="num">${totalMin}</p></div>
      </div>
      <div class="card">
        <div class="row between" style="margin-bottom:10px"><h3>Last 5 weeks</h3><span class="small muted">${last7}/7 this week · goal 5+</span></div>
        ${heatmap(days)}
      </div>
      <div class="card">
        <h3>Pain trend</h3>
        <p class="small muted" style="margin-bottom:8px">Daily check-ins, last 30 days. Lower is better.</p>
        ${hasCi ? lineChart({ labels, series: [
          { color: 'var(--p-relieve)', values: cis.map(c => c?.back ?? null) },
          { color: 'var(--focus)', values: cis.map(c => c?.leg ?? null) },
        ] }) + `<div class="legend" style="margin-top:6px"><span><i style="background:var(--p-relieve)"></i>Back</span><span><i style="background:var(--focus)"></i>Leg</span></div>`
        : '<p class="small muted">No check-ins yet. Log one on the Today tab.</p>'}
      </div>
      <div class="card">
        <h3>How far down the leg</h3>
        <p class="small muted" style="margin-bottom:8px">Pain moving up out of the leg (centralising) is progress.</p>
        ${hasCi ? lineChart({ labels, min: 0, max: 4, height: 120, series: [{ color: 'var(--p-mobilize)', values: cis.map(c => c?.level ?? null) }] })
          .replace(/<text class="lbl" x="(\d+)" y="([\d.]+)" text-anchor="end">\d+<\/text>/g, '') +
          `<p class="small muted">0 none · 1 buttock · 2 thigh · 3 below knee · 4 foot</p>` : '<p class="small muted">No data yet.</p>'}
      </div>
      <div class="card">
        <h3 style="margin-bottom:6px">Recent sessions</h3>
        ${recent.length ? `<ul class="session-list">${recent.map(x => `
          <li><div class="grow"><div style="font-weight:600">${new Date(x.ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtMin(x.secs)}</div>
          <div class="small muted">Phase ${x.phase} · ${PLACES[x.place]?.name ?? ''} · ${x.items.length} exercises${x.partial ? ' · partial' : ''}</div></div>
          <span style="font-size:22px">${feelEmoji[x.feel] || ''}</span></li>`).join('')}</ul>` : '<p class="small muted">Your sessions will show up here.</p>'}
      </div>
    </div>`;
}

// ---------- settings ----------
function icsFor(time) {
  const [hh, mm] = time.split(':');
  const start = addDays(new Date(), 1);
  const z = n => String(n).padStart(2, '0');
  const dt = `${start.getFullYear()}${z(start.getMonth() + 1)}${z(start.getDate())}T${hh}${mm}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const url = location.href.split('#')[0];
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SpineFlow//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:spineflow-daily-${Date.now()}@spineflow`, `DTSTAMP:${stamp}`, `DTSTART:${dt}`, 'DURATION:PT5M',
    'RRULE:FREQ=DAILY', 'SUMMARY:SpineFlow: 5 min for your back',
    `DESCRIPTION:Open SpineFlow and tap Start. ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:SpineFlow time', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

async function shareOrDownload(name, text, type) {
  const file = new File([text], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function renderSettings() {
  const s = store.get();
  const flagged = Object.keys(s.flags).filter(id => isFlagged(id, s) && BY_ID[id]);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  app.innerHTML = `
    <div class="view stack">
      <h1>Settings</h1>
      ${standalone ? '' : `<div class="card"><h3>${icon('spark').replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"')} Install on your iPhone</h3>
        <p class="small muted" style="margin-top:4px">In Safari, tap <b>Share</b> and then <b>Add to Home Screen</b>. SpineFlow then opens full-screen, works offline, and keeps your data on the phone. It's free and needs no account.</p></div>`}
      <p class="tiny muted">Training</p>
      <div class="list">
        <div class="item"><span>Phase</span>
          <select id="phase">
            <option value="auto" ${s.settings.phase === 'auto' ? 'selected' : ''}>Auto (now: ${PHASES[autoPhase(s)].name})</option>
            ${[1, 2, 3].map(n => `<option value="${n}" ${String(s.settings.phase) === String(n) ? 'selected' : ''}>${n} · ${PHASES[n].name}</option>`).join('')}
          </select></div>
        <div class="item"><span>Symptom side</span>
          <select id="side">${['left', 'right', 'both', 'none'].map(v => `<option value="${v}" ${s.side === v ? 'selected' : ''}>${v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select></div>
        <div class="item"><span>Voice coaching</span><label class="switch"><input type="checkbox" id="voice" ${s.settings.voice ? 'checked' : ''}><span></span></label></div>
      </div>
      <p class="small muted">Auto phase: Calm for the first 10 sessions, then Stabilise until session 30, then Build. On a high-pain day you get a Calm session automatically.</p>

      <p class="tiny muted">Daily reminder</p>
      <div class="list">
        <div class="item"><span>Time</span><input type="time" id="rtime" value="${s.settings.reminder}"></div>
        <div class="item"><span class="small muted">Adds a repeating event with an alert to your Calendar, so no notifications server is needed.</span><button class="link" id="ics">Add</button></div>
      </div>

      ${flagged.length ? `<p class="tiny muted">Paused exercises</p><div class="list">${flagged.map(id => `
        <div class="item"><span>${esc(BY_ID[id].name)}</span><button class="link" data-unflag="${id}">Unpause</button></div>`).join('')}</div>` : ''}

      <p class="tiny muted">Your data</p>
      <div class="list">
        <div class="item"><span>Export backup (JSON)</span><button class="link" id="export">Export</button></div>
        <div class="item"><span>Import backup</span><label class="link" style="color:var(--accent);font-weight:600">Import<input type="file" accept="application/json,.json" id="import" hidden></label></div>
        <div class="item"><span>Reset everything</span><button class="link" id="reset" style="color:var(--danger)">Reset</button></div>
      </div>

      <p class="tiny muted">Safety</p>
      <div class="card small">
        <p>SpineFlow is a general exercise guide, not a diagnosis or treatment. Stop and get medical help if you notice:</p>
        <ul class="flags" style="margin-top:8px">${RED_FLAGS.map(f => `<li>${f}</li>`).join('')}</ul>
        <p class="muted" style="margin-top:8px">If leg pain moves further down the leg, or you notice weakness or numbness, see a physiotherapist. SpineFlow uses general movement principles (McGill core work, McKenzie extension, nerve mobilisation, hip hinging). It is not affiliated with any trademarked training system.</p>
      </div>
      <p class="small muted" style="text-align:center">SpineFlow v1 · data stays on this device</p>
    </div>`;

  $('#phase').onchange = e => store.update(x => { x.settings.phase = e.target.value; });
  $('#side').onchange = e => store.update(x => { x.side = e.target.value; });
  $('#voice').onchange = e => store.update(x => { x.settings.voice = e.target.checked; });
  $('#rtime').onchange = e => store.update(x => { x.settings.reminder = e.target.value || '08:00'; });
  $('#ics').onclick = () => shareOrDownload('spineflow-reminder.ics', icsFor(store.get().settings.reminder), 'text/calendar');
  $('#export').onclick = () => shareOrDownload(`spineflow-backup-${dayKey()}.json`, store.export(), 'application/json');
  $('#import').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || data.v !== 1 || !Array.isArray(data.sessions)) throw new Error('bad');
      store.replace(data); toast('Backup restored'); route();
    } catch { toast('That file is not a SpineFlow backup'); }
  };
  let armed = false;
  $('#reset').onclick = e => {
    if (!armed) { armed = true; e.target.textContent = 'Tap again to confirm'; setTimeout(() => { armed = false; if (e.target.isConnected) e.target.textContent = 'Reset'; }, 3000); return; }
    store.reset(); obStep = 0; toast('All data cleared'); location.hash = '#/'; route();
  };
  $$('[data-unflag]').forEach(b => b.onclick = () => { store.update(x => { delete x.flags[b.dataset.unflag]; }); route(); });
}

// ---------- boot ----------
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
