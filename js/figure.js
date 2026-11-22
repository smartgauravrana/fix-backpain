// SVG skeletal figure: forward kinematics + 2-bone IK + keyframe timeline.
//
// Angle convention (degrees, absolute, screen space):
//   0 = pointing down, 90 = forward (+x, the way the figure faces), 180 = up, -90 = backward.
// Pose keys:
//   x,y   hip position            t  torso direction (hip -> shoulder)   c  spine curve (+ flex / - extend)
//   n     head direction           a1,e1 / a2,e2  near/far upper arm + forearm angles
//   h1,k1,f1 / h2,k2,f2  near/far thigh, shin, foot angles
//   A1,A2 / L1,L2  optional IK targets for wrist / ankle: [x,y] or {on:'torso', s, off}
//   bA1.. bL2  IK bend direction (+1 / -1)

const NS = 'http://www.w3.org/2000/svg';
export const W = 360, H = 280, GROUND = 252;
const LEN = { torso: 64, neck: 9, head: 12, ua: 34, la: 32, th: 46, sh: 44, ft: 14 };
const R = Math.PI / 180;
const dir = a => [Math.sin(a * R), Math.cos(a * R)];
const angOf = (dx, dy) => Math.atan2(dx, dy) / R;
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];

function ik(root, target, l1, l2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.hypot(dx, dy);
  const dd = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
  const base = d < 1e-6 ? 0 : angOf(dx, dy);
  const cosA = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA))) / R;
  const a1 = base + bend * A;
  const mid = add(root, dir(a1), l1);
  const end = add(root, dir(base), dd);
  return [a1, angOf(end[0] - mid[0], end[1] - mid[1])];
}

function resolveTarget(spec, hip, torsoDir) {
  if (Array.isArray(spec)) return spec;
  // point along the torso line at fraction s, offset perpendicular toward the back by `off`
  const back = [torsoDir[1], -torsoDir[0]];
  const p = add(hip, torsoDir, LEN.torso * spec.s);
  return add(p, back, spec.off);
}

export function solve(p) {
  const hip = [p.x, p.y];
  const td = dir(p.t);
  const sh = add(hip, td, LEN.torso);
  const back = [td[1], -td[0]];
  const mid = add(hip, td, LEN.torso / 2);
  const ctrl = add(mid, back, (p.c || 0) * 26);
  const nd = dir(p.n);
  const headC = add(sh, nd, LEN.neck + LEN.head);
  const neckE = add(sh, nd, LEN.neck);
  const eye = add(add(headC, dir(p.n - 90), 5), nd, 2);

  const limb = (root, tgt, l1, l2, bend, aA, aB) => {
    if (tgt != null) {
      const t = resolveTarget(tgt, hip, td);
      [aA, aB] = ik(root, t, l1, l2, bend);
    }
    const m = add(root, dir(aA), l1);
    return [m, add(m, dir(aB), l2)];
  };
  const [el1, wr1] = limb(sh, p.A1, LEN.ua, LEN.la, p.bA1 ?? -1, p.a1, p.e1);
  const [el2, wr2] = limb(sh, p.A2, LEN.ua, LEN.la, p.bA2 ?? -1, p.a2, p.e2);
  const [kn1, an1] = limb(hip, p.L1, LEN.th, LEN.sh, p.bL1 ?? 1, p.h1, p.k1);
  const [kn2, an2] = limb(hip, p.L2, LEN.th, LEN.sh, p.bL2 ?? 1, p.h2, p.k2);
  const to1 = add(an1, dir(p.f1 ?? 90), LEN.ft);
  const to2 = add(an2, dir(p.f2 ?? 90), LEN.ft);
  return { hip, sh, ctrl, headC, neckE, eye, el1, wr1, el2, wr2, kn1, an1, to1, kn2, an2, to2, td };
}

// ---------- timeline ----------
const ease = u => 0.5 - 0.5 * Math.cos(Math.PI * u);

function lerpPose(a, b, u) {
  const o = {};
  for (const k in a) {
    const va = a[k], vb = b[k] ?? va;
    if (typeof va === 'number') o[k] = va + (vb - va) * u;
    else if (Array.isArray(va)) o[k] = [va[0] + (vb[0] - va[0]) * u, va[1] + (vb[1] - va[1]) * u];
    else if (va && typeof va === 'object') o[k] = { ...va, s: va.s + (vb.s - va.s) * u, off: va.off + (vb.off - va.off) * u };
    else o[k] = va;
  }
  return o;
}

export function makeTimeline(anim) {
  const frames = anim.frames.map(f => {
    const { _h, _d, ...pose } = f;
    return { pose: { ...anim.base, ...pose }, h: _h ?? 0, d: _d ?? 1000 };
  });
  const cycle = frames.reduce((s, f) => s + f.h + f.d, 0);
  function at(t) {
    t = ((t % cycle) + cycle) % cycle;
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (t < f.h) return f.pose;
      t -= f.h;
      if (t < f.d) return lerpPose(f.pose, frames[(i + 1) % frames.length].pose, ease(t / f.d));
      t -= f.d;
    }
    return frames[0].pose;
  }
  const peak = frames.length > 1 ? frames[0].h + frames[0].d + 1 : 0;
  return { at, cycle, peak };
}

// ---------- rendering ----------
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const setLine = (l, a, b) => {
  l.setAttribute('x1', a[0].toFixed(1)); l.setAttribute('y1', a[1].toFixed(1));
  l.setAttribute('x2', b[0].toFixed(1)); l.setAttribute('y2', b[1].toFixed(1));
};

const FOCUS_EXPAND = {
  arm1: ['ua1', 'la1'], arm2: ['ua2', 'la2'], leg1: ['th1', 'sh1'], leg2: ['th2', 'sh2'],
  thigh1: ['th1'], thigh2: ['th2'], shin1: ['sh1'], shin2: ['sh2'], torso: ['torso'], neck: ['neck'],
};

function drawStaticProps(g, props = []) {
  for (const p of props) {
    if (p.type === 'mat') el('rect', { x: 30, y: GROUND, width: 300, height: 5, rx: 2.5, class: 'prop-mat' }, g);
    if (p.type === 'chair') {
      const { x, w, seat, back } = p;
      el('rect', { x, y: seat, width: w, height: 7, rx: 3, class: 'prop' }, g);
      el('line', { x1: x + 5, y1: seat + 6, x2: x + 5, y2: GROUND, class: 'prop-line' }, g);
      el('line', { x1: x + w - 5, y1: seat + 6, x2: x + w - 5, y2: GROUND, class: 'prop-line' }, g);
      if (back) el('line', { x1: x + 3, y1: back, x2: x + 3, y2: seat + 2, class: 'prop-line thick' }, g);
    }
    if (p.type === 'box') el('rect', { x: p.x, y: p.y, width: p.w, height: GROUND - p.y, rx: 6, class: 'prop' }, g);
    if (p.type === 'wall') el('rect', { x: p.x, y: 20, width: 8, height: GROUND - 20, class: 'prop' }, g);
    if (p.type === 'post') el('rect', { x: p.x - 3, y: 40, width: 6, height: GROUND - 40, rx: 3, class: 'prop' }, g);
    if (p.type === 'anchor') {
      el('rect', { x: p.x - 4, y: 40, width: 8, height: GROUND - 40, rx: 3, class: 'prop' }, g);
      el('circle', { cx: p.x, cy: p.y, r: 5, class: 'prop-anchor' }, g);
    }
  }
}

// Bounding box of everything the exercise ever shows, so each figure is framed tightly.
function fitBox(ex, tl, pad = 20) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = GROUND + 6;
  const eat = (x, y, r = 8) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
  for (let i = 0; i < 24; i++) {
    const j = solve(tl.at((tl.cycle * i) / 24));
    for (const k of ['hip', 'sh', 'el1', 'wr1', 'el2', 'wr2', 'kn1', 'an1', 'to1', 'kn2', 'an2', 'to2', 'ctrl']) eat(j[k][0], j[k][1]);
    eat(j.headC[0], j.headC[1], 14);
    if ((ex.props || []).some(p => p.type === 'dowel')) eat(j.headC[0], j.headC[1] - 30, 10);
  }
  for (const p of ex.props || []) {
    if (p.type === 'chair') { eat(p.x, p.back || p.seat, 4); eat(p.x + p.w, p.seat, 4); }
    if (p.type === 'box') { eat(p.x, p.y, 2); eat(p.x + p.w, p.y, 2); }
    if (p.type === 'wall' || p.type === 'post' || p.type === 'anchor') eat(p.x, y0 + 8, 8);
  }
  x0 -= pad; x1 += pad; y0 -= pad; y1 += 10;
  let w = x1 - x0, h = y1 - y0;
  const ar = W / H;
  if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; }
  else { const nh = w / ar; y0 -= nh - h; h = nh; } // grow upward, keep ground anchored at the bottom
  return { x: x0, y: y0, w, h };
}

export function createFigure(ex) {
  const anim = ex.anim;
  const tl = makeTimeline(anim);
  const box = fitBox(ex, tl);
  const svg = el('svg', { viewBox: `${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}`, class: 'figure', 'aria-hidden': 'true' });
  const scene = el('g', {}, svg);
  const cx = box.x + box.w / 2;
  el('line', { x1: -600, y1: GROUND + 1, x2: 960, y2: GROUND + 1, class: 'ground' }, scene);
  const shadow = el('ellipse', { cx: 180, cy: GROUND + 2, rx: 70, ry: 4, class: 'shadow' }, scene);
  drawStaticProps(scene, ex.props);

  const focus = new Set((ex.focus || []).flatMap(f => FOCUS_EXPAND[f] || [f]));
  const halo = el('g', { class: 'halo' }, scene);
  const dyn = el('g', {}, scene); // dynamic props behind body
  const band = (ex.props || []).find(p => p.type === 'band');
  const bandLine = band ? el('line', { class: 'prop-band' }, dyn) : null;
  const dowelOn = (ex.props || []).some(p => p.type === 'dowel');

  const body = el('g', {}, scene);
  const seg = (name, cls) => el('line', { class: `seg ${cls}${focus.has(name) ? ' focus' : ''}` }, body);
  const parts = {};
  parts.ua2 = seg('ua2', 'far'); parts.la2 = seg('la2', 'far');
  parts.th2 = seg('th2', 'far'); parts.sh2 = seg('sh2', 'far'); parts.ft2 = seg('ft2', 'far foot');
  parts.torso = el('path', { class: `seg torso${focus.has('torso') ? ' focus' : ''}` }, body);
  parts.th1 = seg('th1', 'near'); parts.sh1 = seg('sh1', 'near'); parts.ft1 = seg('ft1', 'near foot');
  parts.neck = seg('neck', 'near neck');
  parts.head = el('circle', { r: 12, class: 'head' }, body);
  parts.eye = el('circle', { r: 1.8, class: 'eye' }, body);
  parts.ua1 = seg('ua1', 'near'); parts.la1 = seg('la1', 'near');
  const dowel = dowelOn ? el('line', { class: 'prop-dowel' }, body) : null;
  const kb = (ex.props || []).some(p => p.type === 'kb') ? el('g', {}, body) : null;
  if (kb) {
    el('path', { d: 'M-7 2 Q0 -10 7 2', class: 'kb-handle' }, kb);
    el('circle', { cx: 0, cy: 12, r: 11, class: 'kb' }, kb);
  }

  // halos for focused segments (pulsing glow drawn behind the body)
  const haloParts = {};
  for (const name of focus) {
    if (name === 'hip' || name === 'shoulder') haloParts[name] = el('circle', { r: 15, class: 'halo-dot' }, halo);
    else if (name === 'torso') haloParts.torso = el('path', { class: 'halo-seg' }, halo);
    else haloParts[name] = el('line', { class: 'halo-seg' }, halo);
  }

  let mirrored = false;
  function setMirror(m) {
    mirrored = m;
    scene.setAttribute('transform', m ? `translate(${(2 * cx).toFixed(1)},0) scale(-1,1)` : '');
  }

  function drawPose(p) {
    const j = solve(p);
    const torsoD = `M${j.hip[0].toFixed(1)} ${j.hip[1].toFixed(1)} Q${j.ctrl[0].toFixed(1)} ${j.ctrl[1].toFixed(1)} ${j.sh[0].toFixed(1)} ${j.sh[1].toFixed(1)}`;
    parts.torso.setAttribute('d', torsoD);
    const map = {
      ua1: [j.sh, j.el1], la1: [j.el1, j.wr1], ua2: [j.sh, j.el2], la2: [j.el2, j.wr2],
      th1: [j.hip, j.kn1], sh1: [j.kn1, j.an1], ft1: [j.an1, j.to1],
      th2: [j.hip, j.kn2], sh2: [j.kn2, j.an2], ft2: [j.an2, j.to2], neck: [j.sh, j.neckE],
    };
    for (const k in map) setLine(parts[k], map[k][0], map[k][1]);
    parts.head.setAttribute('cx', j.headC[0].toFixed(1)); parts.head.setAttribute('cy', j.headC[1].toFixed(1));
    parts.eye.setAttribute('cx', j.eye[0].toFixed(1)); parts.eye.setAttribute('cy', j.eye[1].toFixed(1));
    shadow.setAttribute('cx', ((j.hip[0] + j.sh[0]) / 2).toFixed(1));

    for (const name in haloParts) {
      const h = haloParts[name];
      if (name === 'hip') { h.setAttribute('cx', j.hip[0]); h.setAttribute('cy', j.hip[1]); }
      else if (name === 'shoulder') { h.setAttribute('cx', j.sh[0]); h.setAttribute('cy', j.sh[1]); }
      else if (name === 'torso') h.setAttribute('d', torsoD);
      else if (map[name]) setLine(h, map[name][0], map[name][1]);
    }
    if (bandLine) setLine(bandLine, band.from, j.wr1);
    if (dowel) {
      const back = [j.td[1], -j.td[0]];
      setLine(dowel, add(add(j.hip, j.td, -12), back, 14), add(add(j.hip, j.td, LEN.torso * 1.62), back, 14));
    }
    if (kb) kb.setAttribute('transform', `translate(${j.wr1[0].toFixed(1)},${j.wr1[1].toFixed(1)})`);
  }

  return {
    svg, timeline: tl, setMirror, drawPose,
    draw(t) { drawPose(tl.at(t)); },
    get mirrored() { return mirrored; },
  };
}

// Simple autoplaying animator used by library/detail previews.
export function autoplay(fig) {
  let raf = 0, start = performance.now(), running = true;
  const loop = now => { if (!running) return; fig.draw(now - start); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return () => { running = false; cancelAnimationFrame(raf); };
}
