// Tiny dependency-free SVG charts.
import { addDays, dayKey } from './store.js';

/** series: [{ color, values: [number|null] }], labels: string[] (same length) */
export function lineChart({ series, labels, min = 0, max = 10, height = 150 }) {
  const W = 340, H = height, L = 22, Rt = 6, T = 8, B = 20;
  const n = labels.length;
  const x = i => L + (n <= 1 ? 0 : (i * (W - L - Rt)) / (n - 1));
  const y = v => T + (1 - (v - min) / (max - min)) * (H - T - B);
  let g = '';
  for (const v of [0, 5, 10].filter(v => v >= min && v <= max)) {
    g += `<line class="gl" x1="${L}" x2="${W - Rt}" y1="${y(v)}" y2="${y(v)}"/><text class="lbl" x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
  }
  const step = Math.max(1, Math.ceil(n / 5));
  labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text class="lbl" x="${x(i)}" y="${H - 4}" text-anchor="middle">${l}</text>`; });
  for (const s of series) {
    let d = '', pen = false;
    s.values.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; pen = true;
    });
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    s.values.forEach((v, i) => { if (v != null) g += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="${s.color}"/>`; });
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}

/** 5-week activity heatmap ending this week (Mon-first rows). */
export function heatmap(daysMap) {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const start = addDays(today, -dow - 28);
  let cells = '';
  for (let i = 0; i < 35; i++) {
    const d = addDays(start, i);
    const k = dayKey(d);
    const n = daysMap.get(k) || 0;
    const future = d > today && k !== dayKey(today);
    cells += `<i class="${n >= 2 ? 'l2' : n === 1 ? 'l1' : ''} ${k === dayKey(today) ? 'today' : ''}" style="${future ? 'opacity:.35' : ''}" title="${k}"></i>`;
  }
  return `<div class="heat">${cells}</div>`;
}
