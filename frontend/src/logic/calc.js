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

// `langkah` overrides the drug's own step, for drugs that offer a choice via
// d.tsteps (aminofilin titrates by 0,25 or 0,5 depending on response). Passing
// nothing keeps the drug's default, so every existing caller is unaffected.
export function titrasiDoses(d, sampai, langkah) {
  const batas = sampai ?? d.hi;
  if (d.doses) return d.doses.slice().sort((a, b) => a - b);
  const t = langkah || d.tstep || d.step, out = [];
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

// The "Setara" line flips the time base of the dose. Per-hour doses divide by 60,
// which for the smaller drugs lands on a figure with too many leading zeros to
// read at a glance — vasopresin showed "0,00033 unit/kg/menit". Those step down
// one metric prefix so the number stays legible.
//
// The choice is made per drug from its own `lo`, never from the typed dose, so the
// unit on the card cannot change under the nurse while titrating.
const SUB_PREFIX = { unit: 'mU', mg: 'mcg', mcg: 'ng' };
const setaraSub = (d) => (!d.perMin && d.lo / 60 < 0.01 ? SUB_PREFIX[d.numer] : undefined);
export const setaraUnit = (d) => `${setaraSub(d) || d.numer}/kg/${d.perMin ? 'jam' : 'menit'}`;
export const setaraValue = (d, setara) => (setaraSub(d) ? setara * 1000 : setara);

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

// The lowest rate the unit's syringe pumps hold reliably. A dose computing under
// it needs a more dilute preparation, not a slower pump.
//
// 0,1 mL/jam is what the pumps in use actually manage. An earlier 0,3 was an
// assumption, and it flagged four drugs on a 3 kg infant when three of them
// already had a dilute preparation that cleared the real limit — ketamin 1 mg/mL,
// rokuronium 2 mg/mL, nicardipin 1:400. A warning that fires that often gets
// ignored, which is worse than no warning. At 0,1 it fires where it matters:
// on a default preparation that is genuinely too concentrated for the patient.
export const LAJU_MIN = 0.1;
export const lajuTerlaluPelan = (laju) => isFinite(laju) && laju > 0 && laju < LAJU_MIN;

export function status(d, doseStr) {
  const dose = num(doseStr);
  if (!isFinite(dose)) return ['low', 'Dosis belum diisi'];
  if (dose < d.lo) return ['low', 'Di bawah rentang lazim'];
  if (dose <= d.hi) return ['in', 'Dalam rentang lazim'];
  if (dose <= d.cap) return ['high', 'Di atas rentang lazim — verifikasi instruksi'];
  return ['over', 'Melebihi batas kalkulator'];
}

// Bolus / loading doses are deliberately NOT calculated here, matching the web
// build (index.html): they are given separately from the continuous infusion and
// several drug notes say so explicitly. Deriving a push volume from the infusion
// syringe's concentration is not the same syringe the bolus is drawn from.
