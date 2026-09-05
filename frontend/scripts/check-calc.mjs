// Regression checks for the dosing math and the drug table.
// Run: node scripts/check-calc.mjs   (exits non-zero on failure)
//
// This is deliberately dependency-free so it can run in CI or on any machine
// with Node installed. It does NOT validate clinical appropriateness of the
// ranges — only that the arithmetic and the data table are internally consistent.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DRUGS, ISO, TABEL, defaultPreset } from '../src/data/drugs.js';
import { num, rapi, titrasiDoses, hitung, effAmt, setaraValue, setaraUnit, lajuTerlaluPelan, LAJU_MIN } from '../src/logic/calc.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let failed = 0;
const fail = (m) => { failed++; console.error('  FAIL  ' + m); };
const pass = (m) => console.log('  ok    ' + m);

// --- 1. "Rule of 6" / "Rule of 0,6" presets must give 1 mL/jam at the named dose ---
// Rule of 6:   3 x BB (mg) in 50 mL  ->  1 mL/jam = 1 mcg/kg/menit
// Rule of 0,6: 0,3 x BB (mg) in 50 mL -> 1 mL/jam = 0,1 mcg/kg/menit
for (const [id, namedDose] of [['dopamin', 1], ['dobutamin', 1], ['epinefrin', 0.1], ['norepinefrin', 0.1]]) {
  const d = DRUGS.find((x) => x.id === id);
  const p = d.presets[0];
  if (p.amtPerKg === undefined) { fail(`${id}: preset 0 is not the weight-based rule preset`); continue; }
  let ok = true;
  for (const w of [0.85, 3, 7.4, 12, 45]) {
    const r = hitung(d, { preset: 0, amt: '', ml: String(p.ml), dose: String(namedDose) }, String(w));
    if (!r || Math.abs(r.laju - 1) > 1e-9) { ok = false; fail(`${id} @${w}kg: ${namedDose} => ${r ? r.laju : 'null'} mL/jam, expected 1`); }
  }
  if (ok) pass(`${id}: ${namedDose} ${d.numer}/kg/menit = 1 mL/jam at every weight`);
}

// --- 2. hitung() matches the dimensional formula, independently derived ---
for (const d of DRUGS) {
  const p = d.presets[defaultPreset(d)], w = 10, dose = (d.lo + d.hi) / 2;
  const r = hitung(d, { preset: defaultPreset(d), amt: p.amt !== undefined ? String(p.amt) : '', ml: String(p.ml), dose: String(dose) }, String(w));
  if (!r) { fail(`${d.id}: hitung() returned null for a valid mid-range dose`); continue; }
  const conc = (p.amtPerKg !== undefined ? p.amtPerKg * w : p.amt) / p.ml;
  const expected = (dose * w * (d.perMin ? 60 : 1) * d.conv) / conc;
  if (Math.abs(r.laju - expected) > 1e-9) fail(`${d.id}: laju ${r.laju} != ${expected}`);
}
if (!failed) pass(`all ${DRUGS.length} drugs match the dimensional formula`);

// --- 3. Drug table internal consistency ---
for (const d of DRUGS) {
  if (!(d.lo <= d.hi)) fail(`${d.id}: lo ${d.lo} > hi ${d.hi}`);
  if (!(d.hi <= d.cap)) fail(`${d.id}: hi ${d.hi} > cap ${d.cap}`);
  if (d.start < d.lo || d.start > d.hi) fail(`${d.id}: start ${d.start} outside lo-hi`);
  if (d.tblHi && d.tblHi > d.cap) fail(`${d.id}: tblHi ${d.tblHi} > cap ${d.cap}`);
  if (d.doses) {
    if (d.doses[0] !== d.lo) fail(`${d.id}: doses[0] ${d.doses[0]} != lo ${d.lo}`);
    if (d.doses.at(-1) !== d.hi) fail(`${d.id}: doses last ${d.doses.at(-1)} != hi ${d.hi}`);
  }
  for (const p of d.presets) {
    if (p.amt === undefined && p.amtPerKg === undefined) fail(`${d.id}: preset "${p.t}" has neither amt nor amtPerKg`);
    if (!(p.ml > 0)) fail(`${d.id}: preset "${p.t}" has no volume`);
  }
  // Exactly one default, and the list reads the same way on every drug: the
  // weight-based "Rule of" preparations first, then fixed concentrations dilute ->
  // concentrated. A rule preset's strength scales with the patient, so it has no
  // fixed place in a concentration ordering — 0,3 mg/kg in 50 mL is the most dilute
  // option at 3 kg and the most concentrated at 40 kg. Pinning them to the front
  // keeps the list stable whatever the weight.
  const dflts = d.presets.filter((p) => p.dflt).length;
  if (dflts !== 1) fail(`${d.id}: ${dflts} presets marked dflt — exactly one must be`);
  const firstFixed = d.presets.findIndex((p) => p.amtPerKg === undefined);
  if (d.presets.slice(firstFixed).some((p) => p.amtPerKg !== undefined))
    fail(`${d.id}: weight-based presets must all come before the fixed ones`);
  const c = d.presets.slice(firstFixed).map((p) => p.amt / p.ml);
  const bad = c.findIndex((v, i) => i && v < c[i - 1]);
  if (bad > 0) {
    const j = firstFixed + bad;
    fail(`${d.id}: presets are not dilute -> concentrated ("${d.presets[j].t}" follows "${d.presets[j - 1].t}")`);
  }
}

// --- 4. Titration tables: bounded, ordered, no duplicates, printable length ---
// The printed label is 88mm; more than 12 rows will not fit 6 labels per A4 page.
const MAX_PRINTABLE_ROWS = 12;
let tableCount = 0;
for (const d of DRUGS) {
  // Drugs offering a step choice must satisfy this for EVERY option, not just the
  // default — the chosen step reaches the printed label, so a finer step that
  // overflows 88mm would silently lose rows again.
  if (d.tsteps) {
    if (!d.tsteps.includes(d.tstep)) fail(`${d.id}: default tstep ${d.tstep} is not one of tsteps ${d.tsteps}`);
    if (d.doses) fail(`${d.id}: tsteps has no effect on a drug with a fixed doses[] list`);
  }
  for (const langkah of d.tsteps ?? [undefined]) {
    const t = titrasiDoses(d, d.tblHi ?? d.hi, langkah);
    const lbl = langkah ? `${d.id} @ step ${langkah}` : d.id;
    tableCount++;
    if (!t.length) { fail(`${lbl}: empty titration table`); continue; }
    if (t[0] < d.lo - 1e-9) fail(`${lbl}: first row ${t[0]} below lo ${d.lo}`);
    if (t.at(-1) > (d.tblHi ?? d.hi) + 1e-9) fail(`${lbl}: last row ${t.at(-1)} above limit`);
    if (t.some((v, i) => i && v <= t[i - 1])) fail(`${lbl}: titration rows not strictly ascending`);
    if (t.length > MAX_PRINTABLE_ROWS) fail(`${lbl}: ${t.length} rows will not fit the 88mm printed label (max ${MAX_PRINTABLE_ROWS})`);
  }
}
if (!failed) pass(`${tableCount} titration tables are ordered, bounded and fit the printed label`);

// --- 5. Each note's stated dose range must match the drug's own lo-hi ---
// The card shows "lazim <lo>-<hi>" straight from the data while the note text is
// written by hand, so the two used to drift apart: midazolam read "1-4" under a
// 1-6 range, milrinon "0,25-0,75" under 0,25-2, furosemide "0,1-0,4" under 0,1-0,7.
let checkedNotes = 0;
for (const d of DRUGS) {
  // "titrasi tiap 0,25-0,5 mg/kg/jam" is a titration increment, not a dose range —
  // drop those before looking for the range the card displays.
  const prose = d.note.replace(/tiap\s+\d+(?:,\d+)?[–-]\d+(?:,\d+)?\s*(?:mcg|mg|unit)\/kg\/(?:menit|jam)/gi, '');
  const m = prose.match(/(\d+(?:,\d+)?)[–-](\d+(?:,\d+)?)\s*(mcg|mg|unit)\/kg\/(menit|jam)/);
  if (!m) continue;
  if (m[3] !== d.numer || (m[4] === 'menit') !== !!d.perMin) continue; // a different unit, e.g. an equivalence
  checkedNotes++;
  const [lo, hi] = [m[1], m[2]].map((s) => parseFloat(s.replace(',', '.')));
  if (Math.abs(lo - d.lo) > 1e-9 || Math.abs(hi - d.hi) > 1e-9)
    fail(`${d.id}: note says ${lo}-${hi} but the range shown on the card is ${d.lo}-${d.hi}`);
}
if (!failed) pass(`${checkedNotes} notes state the same range as their data`);

// --- 6. Bolus doses must not be calculated anywhere ---
// They are given separately from the infusion and several notes say so; deriving a
// push volume from the infusion syringe's concentration is the wrong syringe.
for (const rel of ['src/logic/calc.js', 'src/printHtml.js', 'src/components/DrugCard.js', 'App.js']) {
  const txt = readFileSync(join(ROOT, 'frontend', rel), 'utf8');
  const code = txt.replace(/^\s*(\/\/.*|\*.*|\/\*.*)$/gm, ''); // ignore comments
  if (/bolus/i.test(code)) fail(`${rel}: bolus calculation reintroduced (the web build has none)`);
}
if (!failed) pass('no bolus calculation in the app, matching the web build');

// --- 6b. Neither build may treat presets[0] as "the default preparation" ---
// Since presets were ordered dilute -> concentrated, index 0 means "most dilute",
// and the opening preparation is whichever carries dflt. One stale presets[0]
// survived in the web build's "Pasien baru" handler, which silently moved
// vasopresin to 0,1 unit/mL and aminofilin to the un-approved 5 mg/mL on reset.
for (const rel of ['../index.html', 'frontend/App.js', 'frontend/src/printHtml.js',
  'frontend/src/components/DrugCard.js', 'frontend/scripts/genprint.mjs']) {
  const path = rel.startsWith('../') ? join(ROOT, rel.slice(3)) : join(ROOT, rel);
  const code = readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); // ignore comments
  if (/presets\s*\[\s*0\s*\]/.test(code) || /preset:\s*0\b/.test(code))
    fail(`${rel}: uses presets[0] as the default — go through defaultPreset(), index 0 is the most dilute`);
}
if (!failed) pass('both builds open on the marked default preparation, not presets[0]');

// --- 7. The drug table must stay identical to the canonical web build ---
const web = readFileSync(join(ROOT, 'index.html'), 'utf8');
const s0 = web.indexOf('const DRUGS = [');
if (s0 < 0) fail('index.html: could not find the DRUGS table');
else {
  // eslint-disable-next-line no-eval
  const WEB = eval(web.slice(s0 + 'const DRUGS = '.length, web.indexOf('\n];', s0) + 2));
  const i0 = web.indexOf('const ISO = {');
  // eslint-disable-next-line no-eval
  const WEBISO = eval('(' + web.slice(i0 + 'const ISO = '.length, web.indexOf('\n};', i0) + 2) + ')');
  if (JSON.stringify(WEB) !== JSON.stringify(DRUGS))
    fail('drugs.js has drifted from the DRUGS table in index.html — update both together');
  if (JSON.stringify(WEBISO) !== JSON.stringify(ISO))
    fail('the ISO 26825 colour table has drifted from index.html');

  // Both builds must claim the same dose-table revision. A nurse comparing a
  // cached web page against an installed build has nothing else to go on.
  const v0 = web.indexOf('const TABEL = {');
  // eslint-disable-next-line no-eval
  const WEBTABEL = v0 < 0 ? null : eval('(' + web.slice(v0 + 'const TABEL = '.length, web.indexOf('};', v0) + 1) + ')');
  if (!WEBTABEL) fail('index.html declares no TABEL version');
  else if (JSON.stringify(WEBTABEL) !== JSON.stringify(TABEL))
    fail(`dose-table version differs: app ${JSON.stringify(TABEL)} vs web ${JSON.stringify(WEBTABEL)}`);
  if (!failed) pass(`drug table, ISO colours and version v${TABEL.versi} match index.html (${WEB.length} drugs)`);
}

// --- 7a. The slow-rate warning must fire where a preparation is too concentrated ---
// Several drugs have no preparation dilute enough for a small infant at their lowest
// usual dose; the app warns instead of printing a rate the pump cannot hold. These
// two cases anchor the threshold so the warning cannot be silently lost.
{
  // Preset positions are referenced by meaning, never by a literal index — the list
  // is ordered dilute -> concentrated, so index 0 IS the most dilute option and the
  // one to open with is whichever carries dflt. Reordering the presets must not
  // quietly change what these assertions mean.
  const at3 = (id, which) => {
    const d = DRUGS.find((x) => x.id === id);
    const i = which === 'default' ? defaultPreset(d) : 0;
    const p = d.presets[i];
    return hitung(d, { preset: i, amt: p.amt !== undefined ? String(p.amt) : '', ml: String(p.ml),
      dose: String(d.lo) }, '3').laju;
  };
  // MUST warn: the default preparation really is too concentrated for a 3 kg infant.
  for (const id of ['aminofilin', 'ketamin', 'morfin', 'vasopresin']) {
    const v = at3(id, 'default');
    if (!lajuTerlaluPelan(v)) fail(`${id} on its default preparation at 3 kg is ${v} mL/jam — the warning should fire`);
  }
  // MUST NOT warn: the most dilute preparation clears the pump's limit. These are
  // the cases an over-cautious threshold used to flag, training nurses to ignore
  // the warning; dopamin's most dilute is its weight-based rule preset.
  for (const id of ['ketamin', 'rokuronium', 'nicardipin', 'aminofilin', 'dopamin']) {
    const v = at3(id, 'dilute');
    if (lajuTerlaluPelan(v)) fail(`${id} on its most dilute preparation at 3 kg is ${v} mL/jam — the warning should NOT fire`);
  }
  if (!failed) pass(`slow-rate warning fires below ${LAJU_MIN} mL/jam and not on a dilute preparation`);
}

// --- 7b. The "Setara" equivalence must be readable, not a run of leading zeros ---
// vasopresin at 0,02 unit/kg/jam used to render as "0,00033 unit/kg/menit".
let shown = 0;
for (const d of DRUGS) {
  if (d.noSetara) continue; // the line is not displayed for this drug at all
  const p = d.presets[defaultPreset(d)];
  const r = hitung(d, { preset: defaultPreset(d), amt: p.amt !== undefined ? String(p.amt) : '', ml: String(p.ml), dose: String(d.lo) }, '10');
  if (!r) continue;
  shown++;
  const v = setaraValue(d, r.setara);
  if (v > 0 && v < 0.01)
    fail(`${d.id}: "Setara" at the lowest usual dose is ${v} ${setaraUnit(d)} — too small to read`);
}
if (!failed) pass(`the "Setara" equivalence is legible on all ${shown} drugs that show it`);

// --- 8. Weight precision must survive a round trip (regression: 3,25 kg -> 3,3 kg) ---
for (const typed of ['3,25', '0,85', '12,34', '0,675']) {
  const roundTripped = rapi(num(typed));
  if (num(roundTripped) !== num(typed)) fail(`weight ${typed} kg is not preserved (became ${roundTripped})`);
}
if (!failed) pass('typed weights are preserved without rounding');

// --- 9. Invalid input must yield no number, never a stale or zero rate ---
const anyDrug = DRUGS[0];
for (const [label, st, bb] of [
  ['no weight', { preset: 0, amt: '50', ml: '50', dose: '2' }, ''],
  ['no volume', { preset: 0, amt: '50', ml: '', dose: '2' }, '10'],
  ['no amount', { preset: -1, amt: '', ml: '50', dose: '2' }, '10'],
]) if (hitung(anyDrug, st, bb) !== null) fail(`hitung() returned a rate with ${label}`);
if (!failed) pass('incomplete input returns no rate');

// --- 10. Weight-based presets need a weight before showing an amount ---
const epi = DRUGS.find((d) => d.id === 'epinefrin');
if (effAmt(epi, { preset: 0, amt: '' }, '') !== 0) fail('weight-based preset reports an amount with no weight');
if (effAmt(epi, { preset: 0, amt: '' }, '10') !== 3) fail('rule-of-0,6 amount at 10 kg should be 3 mg');

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
