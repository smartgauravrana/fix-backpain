// Full-screen guided session player.
import { BY_ID, PILLARS, ytSearchUrl, ytWatchUrl } from './exercises.js';
import { createFigure } from './figure.js';
import { cycleMs, setSecs, REST } from './program.js';
import { store, dayKey } from './store.js';
import { icon, toast, esc } from './ui.js';

// ---------- voice ----------
let voices = [];
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  voices = speechSynthesis.getVoices();
  return voices.find(v => /en-(GB|US|AU|IN)/.test(v.lang) && /Samantha|Daniel|Karen|Google|Natural|Premium|Enhanced/.test(v.name))
      || voices.find(v => v.lang?.startsWith('en')) || null;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;
function speak(text, { interrupt = true } = {}) {
  if (!store.get().settings.voice || !('speechSynthesis' in window)) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(); if (v) u.voice = v;
  u.rate = 1.02; u.pitch = 1;
  speechSynthesis.speak(u);
}

// ---------- wake lock ----------
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* not supported / denied */ }
}

function sideName(i) {
  const s = store.get().side;
  const first = s === 'right' ? 'Right' : 'Left';
  const second = first === 'Left' ? 'Right' : 'Left';
  return i === 0 ? first : second;
}

function buildSteps(items) {
  const steps = [{ type: 'ready', secs: 5 }];
  items.forEach((it, ii) => {
    const ex = BY_ID[it.id];
    for (let set = 1; set <= it.sets; set++) {
      for (let side = 0; side < ex.dose.sides; side++) {
        steps.push({ type: 'work', ex, set, sets: it.sets, side, sides: ex.dose.sides, secs: setSecs(ex, it.secs), timed: !!(it.secs ?? ex.dose.secs) });
        const lastSide = side === ex.dose.sides - 1, lastSet = set === it.sets;
        if (!lastSide) steps.push({ type: 'rest', kind: 'side', secs: REST.side });
        else if (!lastSet) steps.push({ type: 'rest', kind: 'set', secs: REST.set });
      }
    }
    if (ii < items.length - 1) steps.push({ type: 'rest', kind: 'between', secs: REST.between });
  });
  // link each rest/ready to the work step that follows it
  for (let i = steps.length - 1, next = null; i >= 0; i--) {
    if (steps[i].type === 'work') next = steps[i]; else steps[i].next = next;
  }
  return steps;
}

export function runSession({ items, phase, place, title = 'Session', onExit }) {
  const steps = buildSteps(items);
  const totalEst = steps.reduce((t, s) => t + s.secs, 0);
  let idx = 0, elapsed = 0, paused = false, last = performance.now(), raf = 0;
  let workMs = 0, lastRep = -1, lastSpoken = -1, cueIdx = 0, cueTimer = 0;
  const done = new Set();
  let fig = null, finished = false;

  const root = document.createElement('div');
  root.className = 'player';
  root.innerHTML = `
    <div class="top">
      <button class="icon-btn" data-act="close" aria-label="End session">${icon('x')}</button>
      <div class="progress"><i style="width:0%"></i></div>
      <button class="icon-btn" data-act="voice" aria-label="Toggle voice">${icon(store.get().settings.voice ? 'volume' : 'mute')}</button>
    </div>
    <div class="stage"></div>
    <div class="controls">
      <button class="icon-btn" data-act="prev" aria-label="Previous">${icon('prev')}</button>
      <button class="icon-btn lg" data-act="pause" aria-label="Pause">${icon('pause')}</button>
      <button class="icon-btn" data-act="next" aria-label="Next">${icon('next')}</button>
    </div>`;
  document.body.appendChild(root);
  document.querySelector('.tabbar')?.classList.add('hidden');
  const stage = root.querySelector('.stage');
  const bar = root.querySelector('.progress i');
  keepAwake(true);
  const onVis = () => { if (document.visibilityState === 'visible' && !finished) keepAwake(true); };
  document.addEventListener('visibilitychange', onVis);

  const ringHTML = `<div class="ring"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/><circle class="bar" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg><div class="lbl">0</div></div>`;

  function renderStep() {
    const st = steps[idx];
    elapsed = 0; lastRep = -1; lastSpoken = -1; cueIdx = 0; cueTimer = 0;
    stage.innerHTML = '';
    fig = null;
    const doneEst = steps.slice(0, idx).reduce((t, s) => t + s.secs, 0);
    bar.style.width = `${Math.round((doneEst / totalEst) * 100)}%`;

    if (st.type === 'work') {
      const ex = st.ex;
      const p = PILLARS[ex.pillar];
      stage.innerHTML = `
        <div class="row between" style="margin-bottom:6px">
          <span class="tag" style="color:${p.color}"><span class="dot"></span>${p.name}</span>
          <span class="small muted">Set ${st.set}/${st.sets}</span>
        </div>
        <h2>${esc(ex.name)}</h2>
        <div class="fig-box">
          ${st.sides === 2 ? `<span class="tag side-tag">${sideName(st.side)} side</span>` : ''}
        </div>
        <div class="counter"></div>
        <p class="cue"></p>
        <div class="row wrap" style="justify-content:center;gap:6px;margin:6px 0 12px">
          ${ex.muscles.map(m => `<span class="tag muscle"><span class="dot"></span>${esc(m)}</span>`).join('')}
        </div>
        <div class="row" style="justify-content:center;gap:10px">
          <a class="hurt video-link" data-act="video" target="_blank" rel="noopener"
             href="${store.get().videos?.[ex.id] ? ytWatchUrl(store.get().videos[ex.id]) : ytSearchUrl(ex)}">▶ Video</a>
          <button class="hurt" data-act="hurt">This hurts — skip</button>
        </div>`;
      fig = createFigure(ex);
      fig.setMirror(st.side === 1);
      stage.querySelector('.fig-box').prepend(fig.svg);
      const counter = stage.querySelector('.counter');
      counter.innerHTML = st.timed ? ringHTML : `<div class="big"><span class="n">0</span><span class="of"> / ${ex.dose.reps}</span></div><div class="small muted">reps · follow the figure's tempo</div>`;
      setCue(ex.cues[0]);
      const intro = st.set === 1 && st.side === 0 ? `${ex.name}. ` : '';
      speak(`${intro}${st.sides === 2 ? sideName(st.side) + ' side. ' : ''}${st.set > 1 && st.side === 0 ? 'Set ' + st.set + '. ' : ''}${st.timed ? 'Go.' : ex.cues[0]}`);
    } else if (st.type === 'rest' || st.type === 'ready') {
      const nx = st.next;
      const head = st.type === 'ready' ? 'Get ready' : st.kind === 'side' ? 'Switch sides' : st.kind === 'set' ? 'Rest' : 'Up next';
      stage.innerHTML = `
        <div class="rest-screen">
          <p class="tiny muted">${head}</p>
          <div style="margin:16px 0">${ringHTML}</div>
          ${nx ? `<div class="next card flat">
            <div class="row"><div class="grow" style="text-align:left">
              <h3>${esc(nx.ex.name)}</h3>
              <p class="small muted">${esc(nx.ex.objective)}</p>
            </div></div>
            <div class="mini-fig" style="max-width:260px;margin:8px auto 0"></div>
          </div>` : ''}
          <button class="btn ghost" data-act="next" style="margin-top:14px">Skip rest</button>
        </div>`;
      if (nx) {
        fig = createFigure(nx.ex);
        fig.setMirror(nx.side === 1);
        stage.querySelector('.mini-fig').append(fig.svg);
      }
      if (st.type === 'ready') speak(`Get ready. First up: ${nx?.ex.name ?? ''}`);
      else if (st.kind === 'side') speak('Switch sides');
      else if (st.kind === 'set') speak('Rest');
      else if (nx) speak(`Rest. Up next: ${nx.ex.name}`);
    } else if (st.type === 'done') {
      finish(false);
    }
  }

  function setCue(t) {
    const c = stage.querySelector('.cue');
    if (!c) return;
    c.style.opacity = 0;
    setTimeout(() => { c.textContent = t; c.style.opacity = 1; }, 150);
  }

  function setRing(remaining, total) {
    const b = stage.querySelector('.ring .bar'), l = stage.querySelector('.ring .lbl');
    if (!b) return;
    b.style.strokeDashoffset = (326.7 * (1 - remaining / total)).toFixed(1);
    l.textContent = Math.ceil(remaining);
  }

  function advance(dir = 1) {
    const st = steps[idx];
    if (st.type === 'work' && dir > 0) done.add(st.ex.id);
    idx = Math.max(0, Math.min(steps.length, idx + dir));
    if (dir < 0) { while (idx > 0 && steps[idx].type !== 'work') idx--; }
    if (idx >= steps.length) return finish(false);
    renderStep();
  }

  function tick(now) {
    if (finished) return;
    const dt = Math.max(0, Math.min(100, now - last)); last = now;
    if (!paused && !finished) {
      elapsed += dt;
      const st = steps[idx];
      if (st.type === 'work') workMs += dt;
      if (fig) fig.draw(st.type === 'work' ? elapsed : 0);
      if (st.type === 'work' && !st.timed) {
        const reps = Math.floor(elapsed / cycleMs(st.ex));
        if (reps !== lastRep) {
          lastRep = reps;
          const n = stage.querySelector('.counter .n');
          if (n) { n.textContent = reps; n.parentElement.animate?.([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 250 }); }
          if (reps > 0 && reps < st.ex.dose.reps) speak(String(reps));
          if (reps >= st.ex.dose.reps) return advanceLater();
        }
      } else {
        const remaining = Math.max(0, st.secs - elapsed / 1000);
        setRing(remaining, st.secs);
        const r = Math.ceil(remaining);
        if (r !== lastSpoken) {
          lastSpoken = r;
          if (r <= 3 && r > 0 && (st.type !== 'work' || st.secs >= 10)) speak(String(r));
          if (st.type === 'work' && r === 10 && st.secs >= 25) speak('10 seconds');
        }
        if (remaining <= 0) return advanceLater();
      }
      if (st.type === 'work') {
        cueTimer += dt;
        if (cueTimer > 6000) { cueTimer = 0; cueIdx = (cueIdx + 1) % st.ex.cues.length; setCue(st.ex.cues[cueIdx]); }
      }
    }
    raf = requestAnimationFrame(tick);
  }
  function advanceLater() { advance(1); if (!finished) raf = requestAnimationFrame(tick); }

  function setPaused(p) {
    paused = p;
    root.querySelector('[data-act=pause]').innerHTML = icon(p ? 'play' : 'pause');
    if (p && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  function finish(early) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    keepAwake(false);
    const secs = Math.round(workMs / 1000);
    if (early && secs < 30) return close();
    bar.style.width = '100%';
    root.querySelector('.controls').style.visibility = 'hidden';
    stage.innerHTML = `
      <div style="text-align:center" class="stack">
        <div class="done-burst">${icon('check')}</div>
        <h1>${early ? 'Nice work' : 'Session complete'}</h1>
        <p class="muted">${Math.max(1, Math.round(secs / 60))} min of movement · ${done.size} exercise${done.size === 1 ? '' : 's'}</p>
        <div class="card flat" style="text-align:left">
          <h3 style="margin-bottom:10px">Compared with before you started, your back and leg feel…</h3>
          <div class="feel">
            <button data-feel="better"><span>😌</span>Better</button>
            <button data-feel="same"><span>😐</span>Same</button>
            <button data-feel="worse"><span>😣</span>Worse</button>
          </div>
          <p class="small muted feel-note" style="margin-top:10px"></p>
        </div>
        <button class="btn primary block big" data-act="save">Save &amp; finish</button>
      </div>`;
    speak(early ? 'Nice work.' : 'Session complete. Great job.');
    let feel = null;
    stage.querySelectorAll('[data-feel]').forEach(b => b.onclick = () => {
      feel = b.dataset.feel;
      stage.querySelectorAll('[data-feel]').forEach(x => x.classList.toggle('on', x === b));
      stage.querySelector('.feel-note').textContent = feel === 'worse'
        ? 'Noted. Tomorrow will lean gentler. If pain spreads down the leg, use "This hurts" on the exercise that caused it.'
        : feel === 'better' ? 'That\'s the goal — movement as medicine.' : 'Consistency wins. Same is fine.';
    });
    stage.querySelector('[data-act=save]').onclick = () => {
      if (secs >= 30) {
        store.update(s => s.sessions.push({
          id: Date.now(), date: dayKey(), ts: Date.now(), secs, phase, place,
          items: [...done], feel, partial: early,
        }));
      }
      close(true);
    };
  }

  function close(saved = false) {
    finished = true;
    cancelAnimationFrame(raf);
    keepAwake(false);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.removeEventListener('visibilitychange', onVis);
    root.remove();
    document.querySelector('.tabbar')?.classList.remove('hidden');
    onExit?.(saved);
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'close') { if (finished) close(); else finish(true); }
    if (a === 'pause') setPaused(!paused);
    if (a === 'video') setPaused(true); // let the link open YouTube; resume with play when back
    if (a === 'next') { setPaused(false); advance(1); }
    if (a === 'prev') { setPaused(false); advance(-1); }
    if (a === 'voice') {
      store.update(s => { s.settings.voice = !s.settings.voice; });
      b.innerHTML = icon(store.get().settings.voice ? 'volume' : 'mute');
      if (!store.get().settings.voice && 'speechSynthesis' in window) speechSynthesis.cancel();
    }
    if (a === 'hurt') {
      const ex = steps[idx].ex;
      store.update(s => { s.flags[ex.id] = Date.now() + 7 * 86400000; });
      toast(`${ex.name} paused for 7 days`);
      speak('Okay, skipping that one.');
      // jump past every remaining step of this exercise
      let j = idx + 1;
      while (j < steps.length && (steps[j].type !== 'work' || steps[j].ex.id === ex.id)) j++;
      // back up onto the rest step before the next exercise, if any
      idx = j < steps.length && steps[j - 1]?.type === 'rest' ? j - 1 : j;
      setPaused(false);
      if (idx >= steps.length) finish(false); else renderStep();
    }
  });

  renderStep();
  raf = requestAnimationFrame(tick);
  return { close };
}
