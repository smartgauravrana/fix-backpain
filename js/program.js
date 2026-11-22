// Phase logic + session builder.
import { EXERCISES, BY_ID } from './exercises.js';
import { makeTimeline } from './figure.js';
import { store, todayCheckin, previousCheckin, isFlagged, dayKey } from './store.js';

export const PHASES = {
  1: { name: 'Calm', blurb: 'Settle the nerve and ease pain with gentle movement.' },
  2: { name: 'Stabilise', blurb: 'Build core endurance with the McGill Big 3.' },
  3: { name: 'Build', blurb: 'Load functional patterns: hinge, squat, lunge, carry.' },
};

const PRIORITY = {
  1: ['cat-camel', 'prone-press-up', 'nerve-floss-seated', 'nerve-glide-supine', 'standing-extension', 'breathing-9090', 'glute-bridge', 'walk'],
  2: ['cat-camel', 'curl-up', 'side-plank', 'bird-dog', 'nerve-floss-seated', 'standing-extension', 'glute-bridge', 'hip-hinge', 'dead-bug', 'pallof-press', 'sit-to-stand', 'walk'],
  3: ['cat-camel', 'bird-dog', 'side-plank', 'curl-up', 'hip-hinge', 'split-squat', 'sl-rdl', 'suitcase-carry', 'pallof-press', 'sit-to-stand', 'standing-extension', 'glute-bridge', 'dead-bug', 'walk'],
};
const MOBILITY = {
  1: ['seated-t-ext', 'rock-back', 'hip-flexor-stretch', 'ankle-rock', 'open-book'],
  2: ['hip-flexor-stretch', 'seated-t-ext', 'rock-back', 'open-book', 'deep-squat', 'ankle-rock'],
  3: ['hip-flexor-stretch', 'deep-squat', 'open-book', 'ankle-rock', 'rock-back', 'seated-t-ext'],
};
const PLACE_RANK = { anywhere: 0, floor: 1, gym: 2 };

export const REST = { set: 15, side: 5, between: 8 };

const cycleCache = new Map();
export function cycleMs(ex) {
  if (!cycleCache.has(ex.id)) cycleCache.set(ex.id, makeTimeline(ex.anim).cycle);
  return cycleCache.get(ex.id);
}
/** seconds for one set on one side */
export function setSecs(ex, secsOverride) {
  return secsOverride ?? ex.dose.secs ?? Math.round((ex.dose.reps * cycleMs(ex)) / 1000);
}
export function itemSecs(ex, sets, secsOverride) {
  const blocks = sets * ex.dose.sides;
  return blocks * setSecs(ex, secsOverride) + (sets - 1) * REST.set + (sets * (ex.dose.sides - 1)) * REST.side;
}
export function doseLabel(ex, sets = ex.dose.sets, secsOverride) {
  const side = ex.dose.sides === 2 ? ' / side' : '';
  const secs = secsOverride ?? ex.dose.secs;
  if (secs) return `${sets} × ${secs >= 60 ? Math.round(secs / 30) / 2 + ' min' : secs + ' s'}${side}`;
  return `${sets} × ${ex.dose.reps}${side}`;
}

export function completedCount(s = store.get()) { return s.sessions.length; }

export function autoPhase(s = store.get()) {
  const n = completedCount(s);
  return n < 10 ? 1 : n < 30 ? 2 : 3;
}

/** Today's context: which phase to train and any caution message. */
export function todayStatus(s = store.get()) {
  const base = s.settings.phase === 'auto' ? autoPhase(s) : Number(s.settings.phase);
  const ci = todayCheckin(s);
  const prev = previousCheckin(s);
  let phase = base, caution = null, calmDay = false;
  if (ci && (ci.back >= 6 || ci.leg >= 5)) {
    phase = 1; calmDay = true;
    caution = 'High pain today — switched to a gentle Calm session. Move, but stay in comfortable ranges.';
  }
  if (ci && prev && ci.level > prev.level && ci.level >= 2) {
    phase = 1; calmDay = true;
    caution = 'Your leg symptoms reach further down than last time. Calm session only today. If this keeps happening for several days or you notice weakness or numbness, see a physio or doctor.';
  }
  return { phase, basePhase: base, calmDay, caution };
}

function rotate(arr, n) { if (!arr.length) return arr; const k = n % arr.length; return [...arr.slice(k), ...arr.slice(0, k)]; }

/**
 * Build a session that fits `minutes` in `place` for `phase`.
 * Returns [{ id, sets }] in training order: relieve → stabilise → strengthen → mobilise.
 */
export function buildSession({ minutes, place, phase, s = store.get() }) {
  const budget = minutes * 60;
  const ok = id => {
    const ex = BY_ID[id];
    return ex && PLACE_RANK[ex.place] <= PLACE_RANK[place] && !isFlagged(id, s);
  };
  const day = Math.floor(new Date(dayKey()).getTime() / 86400000);
  let main = PRIORITY[phase].filter(ok);
  if (place === 'gym') { // bring the gym-only tools forward when you're actually at the gym
    const gymOnly = main.filter(id => BY_ID[id].place === 'gym');
    const rest = main.filter(id => BY_ID[id].place !== 'gym');
    main = [...rest.slice(0, 3), ...gymOnly, ...rest.slice(3)];
  }
  // "walk" only belongs in a session when there's nothing else (short anywhere sessions) — keep it last
  const mob = rotate(MOBILITY[phase].filter(ok), day);

  const items = [];
  let used = 0;
  const cost = (id, sets) => itemSecs(BY_ID[id], sets) + REST.between;
  const mobReserve = budget >= 240 ? budget * 0.22 : 0;

  for (const id of main) {
    if (id === 'walk') continue;
    const c = cost(id, 1);
    if (used + c <= (budget - mobReserve) * 1.08) { items.push({ id, sets: 1 }); used += c; }
  }
  for (const id of mob) {
    if (items.some(i => i.id === id)) continue;
    const c = cost(id, 1);
    if (used + c <= budget * 1.1) { items.push({ id, sets: 1 }); used += c; }
    if (budget < 240 && items.length >= 3) break;
  }
  // Grow sets round-robin while time remains.
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of items) {
      const ex = BY_ID[it.id];
      if (it.sets >= ex.dose.sets) continue;
      const extra = cost(it.id, it.sets + 1) - cost(it.id, it.sets);
      if (used + extra <= budget * 1.05) { it.sets++; used += extra; grew = true; }
    }
  }
  // Top up leftover time with a brisk walk (the best-evidenced back-pain exercise).
  const left = budget - used;
  if (ok('walk') && left >= 90 && !items.some(i => i.id === 'walk')) {
    items.push({ id: 'walk', sets: 1, secs: Math.min(600, Math.floor((left - REST.between) / 30) * 30) });
  }
  if (!items.length) {
    const fallback = EXERCISES.find(e => ok(e.id) && setSecs(e) <= budget) || BY_ID.walk;
    items.push({ id: fallback.id, sets: 1 });
  }
  const order = { relieve: 0, stabilize: 1, strengthen: 2, mobilize: 3 };
  items.sort((a, b) => order[BY_ID[a.id].pillar] - order[BY_ID[b.id].pillar]);
  // walk is a great finisher, not a starter
  items.sort((a, b) => (a.id === 'walk') - (b.id === 'walk'));
  return items;
}

export function sessionSecs(items) {
  return items.reduce((t, it) => t + itemSecs(BY_ID[it.id], it.sets, it.secs) + REST.between, 0);
}

export const TIPS = [
  'Walking is one of the best-evidenced treatments for back pain. Two 10-minute walks count.',
  'Avoid deep forward bending in the first hour after waking — discs are more hydrated and sensitive then.',
  '"Centralisation" — leg pain retreating toward the back — is a good sign, even if back pain briefly increases.',
  'Sitting for long stretches loads the discs. Stand up every 30–45 minutes, even for 20 seconds.',
  'Hinge from the hips to pick things up: soft knees, flat back, push the hips back.',
  'Core endurance (holding positions) protects the back better than core strength (crunches).',
  'Sleep matters: pain sensitivity rises sharply after a bad night. A pillow between the knees helps side-sleepers.',
  'Hurt ≠ harm. Mild discomfort that settles within a day is fine; sharp or spreading pain is your cue to back off.',
  'Habit tip: attach SpineFlow to something you already do — after brushing teeth, before your first coffee, between gym sets.',
  'Nerve glides should feel like gentle flossing, not stretching. Never hold a nerve at end range.',
  'Breathing out while bracing keeps pressure off the spine. Don\'t hold your breath during holds.',
  'At the gym: warm up with the Big 3 (curl-up, side plank, bird dog) before deadlifts or squats.',
];
