// Local-first persistence (localStorage, versioned JSON).
const KEY = 'spineflow.v1';

const DEFAULT = () => ({
  v: 1,
  onboarded: false,
  side: 'left',
  settings: { voice: true, phase: 'auto', minutes: 5, place: 'anywhere', reminder: '08:00' },
  checkins: {},   // 'YYYY-MM-DD' -> { back, leg, level, ts }
  sessions: [],   // { id, date, ts, secs, phase, place, items: [ids], feel }
  flags: {},      // exerciseId -> untilTs
  videos: {},     // exerciseId -> pinned YouTube video id
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT();
    const s = JSON.parse(raw);
    const d = DEFAULT();
    return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
  } catch { return DEFAULT(); }
}

let state = load();
const subs = new Set();

export const store = {
  get: () => state,
  update(fn) {
    fn(state);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full / private mode */ }
    subs.forEach(f => f(state));
  },
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
  replace(next) { store.update(s => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, DEFAULT(), next); }); },
  reset() { store.replace(DEFAULT()); },
  export: () => JSON.stringify(state, null, 2),
};

// ---------- dates ----------
export function dayKey(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }

// ---------- derived ----------
export function sessionDays(s = state) {
  const m = new Map();
  for (const x of s.sessions) m.set(x.date, (m.get(x.date) || 0) + 1);
  return m;
}

export function streak(s = state) {
  const days = sessionDays(s);
  let d = new Date();
  if (!days.has(dayKey(d))) d = addDays(d, -1); // today not done yet: streak still alive from yesterday
  let n = 0;
  while (days.has(dayKey(d))) { n++; d = addDays(d, -1); }
  return n;
}

export function bestStreak(s = state) {
  const keys = [...sessionDays(s).keys()].sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const d = parseKey(k);
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}

export function todayCheckin(s = state) { return s.checkins[dayKey()] || null; }

export function previousCheckin(s = state) {
  const today = dayKey();
  const keys = Object.keys(s.checkins).filter(k => k < today).sort();
  return keys.length ? s.checkins[keys[keys.length - 1]] : null;
}

export function isFlagged(id, s = state) { return (s.flags[id] || 0) > Date.now(); }
