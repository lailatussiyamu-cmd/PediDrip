// Calculation & number-formatting logic ported from PediDrip index.html.
// Rules: no patient data persisted, typed doses never silently rounded,
// empty fields show empty (never a stale number).

export function num(v) {
  if (v === null || v === undefined) return NaN;
  const t = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (t === '' || !/^[0-9]*\.?[0-9]*$/.test(t)) return NaN;
  const n = parseFloat(t);
  return isFinite(n) ? n : NaN;
}

// Filter typing: digits only, single comma, no minus. Returns comma-decimal string.
export function saring(v) {
  let t = String(v).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const p = t.split('.');
  if (p.length > 2) t = p[0] + '.' + p.slice(1).join('');
  if (t.startsWith('.')) t = '0' + t;
  return t.replace('.', ',');
}

export const fmt = (v, dec) => (isFinite(v) ? v.toFixed(dec).replace('.', ',') : '—');

// For preparation amounts: 50 stays "50", not "50,000".
export function rapi(v) {
  const n = typeof v === 'string' ? num(v) : v;
  if (!isFinite(n) || n <= 0) return '';
  return String(Math.round(n * 1000) / 1000).replace('.', ',');
}

// Concentration without trailing zeros (ISMP rule): "1 mg/mL" not "1,000 mg/mL".
export function konsen(v) {
  if (!isFinite(v) || v <= 0) return '—';
  const b = Math.round(v * 1000) / 1000;
  return (b > 0 ? String(b) : v.toPrecision(2)).replace('.', ',');
}

export const dec = (d) => (d.step >= 1 ? 0 : d.step >= 0.1 ? 1 : 2);
const nd = (v) => { const t = String(v); return t.includes('.') ? t.split('.')[1].length : 0; };
export const tdec = (d) =>
  d.doses
    ? Math.min(3, Math.max(...d.doses.map(nd)))
    : Math.min(3, Math.max(nd(d.tstep || d.step), nd(d.lo), nd(d.hi)));

export function titrasiDoses(d, sampai) {
  const batas = sampai ?? d.hi;
  if (d.doses) return d.doses.slice().sort((a, b) => a - b);
  const t = d.tstep || d.step, out = [];
  const r = (v) => Math.round(v * 1000) / 1000;
  if (d.lo % t !== 0) out.push(r(d.lo));
  for (let v = Math.ceil(r(d.lo / t)) * t; r(v) <= r(batas) + 1e-9; v += t) {
    const x = r(v);
    if (x >= d.lo - 1e-9 && !out.includes(x)) out.push(x);
  }
  if (!out.includes(r(batas))) out.push(r(batas));
  return out.sort((a, b) => a - b);
}

export const doseUnit = (d) => `${d.numer}/kg/${d.perMin ? 'menit' : 'jam'}`;
export const setaraUnit = (d) => `${d.numer}/kg/${d.perMin ? 'jam' : 'menit'}`;

// Effective drug amount (mg/mcg/unit) — weight-based presets compute from bb.
export function effAmt(d, st, bb) {
  const w = num(bb);
  const p = st.preset >= 0 ? d.presets[st.preset] : null;
  if (p && p.amtPerKg !== undefined) return w > 0 ? +(p.amtPerKg * w).toFixed(3) : 0;
  return num(st.amt);
}
export const isWeightBased = (d, st) => {
  const p = st.preset >= 0 ? d.presets[st.preset] : null;
  return !!(p && p.amtPerKg !== undefined);
};

export function hitung(d, st, bb) {
  const amt = effAmt(d, st, bb), ml = num(st.ml), dose = num(st.dose), w = num(bb);
  if (!(w > 0) || !(amt > 0) || !(ml > 0) || !(dose >= 0)) return null;
  const conc = amt / ml;
  if (!(conc > 0) || !isFinite(conc)) return null;
  const perJamNum = dose * w * (d.perMin ? 60 : 1);
  const perJamAmt = perJamNum * d.conv;
  const laju = perJamAmt / conc;
  if (!isFinite(laju) || laju < 0) return null;
  return {
    amt, ml, conc, perJamNum, perJamAmt, laju,
    setara: d.perMin ? dose * 60 : dose / 60,
    habis: laju > 0 ? ml / laju : Infinity,
  };
}

// Same as hitung but with an explicit dose (for titration rows).
export function hitungDose(d, st, bb, dose) {
  return hitung(d, { ...st, dose }, bb);
}

export function status(d, doseStr) {
  const dose = num(doseStr);
  if (!isFinite(dose)) return ['low', 'Dosis belum diisi'];
  if (dose < d.lo) return ['low', 'Di bawah rentang lazim'];
  if (dose <= d.hi) return ['in', 'Dalam rentang lazim'];
  if (dose <= d.cap) return ['high', 'Di atas rentang lazim — verifikasi instruksi'];
  return ['over', 'Melebihi batas kalkulator'];
}

// Bolus / loading dose: total drug amount (in amtUnit) and volume (mL) for one push.
export function bolusCalc(bolus, d, st, bb, doseStr) {
  const w = num(bb), dose = num(doseStr);
  if (!bolus || !(w > 0) || !(dose > 0)) return null;
  const totalAmt = dose * bolus.f * w; // in drug amtUnit
  const amt = effAmt(d, st, bb), ml = num(st.ml);
  const conc = amt > 0 && ml > 0 ? amt / ml : null;
  const vol = conc ? totalAmt / conc : null;
  return { totalAmt, vol };
}
