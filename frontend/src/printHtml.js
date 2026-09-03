// Pure HTML builder for the printable therapy sheet + ISO syringe titration cards.
// No native imports here so it can run on web and native alike.
import { DRUGS, isoOf } from './data/drugs';
import { BOLUS } from './data/bolus';
import { fmt, rapi, konsen, dec, tdec, titrasiDoses, doseUnit, hitung, hitungDose, bolusCalc, num } from './logic/calc';

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function labelCard(d, st, bb, patient) {
  const iso = isoOf(d);
  const r0 = hitung(d, st, bb);
  const TD = tdec(d);
  const batas = d.tblHi ?? d.hi;
  const ratio = r0 ? r0.conc / d.conv : null;
  const ratioTD = ratio !== null && ratio < 10 ? 1 : 0;
  const rows = titrasiDoses(d, batas).map((dose) => {
    const rr = hitungDose(d, st, bb, dose);
    const ext = dose > d.hi ? ' style="background:#fff8e1"' : '';
    return `<tr${ext}><td>${fmt(dose, TD)}</td><td style="text-align:right">${rr ? fmt(rr.laju, 2) : '—'}</td></tr>`;
  }).join('');
  const head = iso
    ? `<span class="sw" style="background:${iso.hex}"></span>${iso.warna.toUpperCase()}`
    : `TIDAK DIATUR`;
  const idCell = (k, v) => `<div class="idc"><span class="idk">${k}</span><span class="idv">${v ? esc(v) : '&nbsp;'}</span></div>`;
  return `<div class="tcard" style="border-color:${iso ? iso.hex : '#999'}">
    <h4 style="background:${iso ? iso.hex : '#eee'}">${esc(d.nama)} <span class="warna">${head}</span> <span class="klass">${esc(d.klass)}</span></h4>
    <div class="tid">${idCell('Nama pasien', patient.pn)}${idCell('No. RM', patient.prm)}</div>
    <p class="cx"><b>BB : ${fmt(bb, 1)} kg</b> &middot; Titrasi 1 mL : ${ratio !== null ? fmt(ratio, ratioTD) : '—'} ${d.numer}</p>
    <table><thead><tr><th>Dosis (${doseUnit(d)})</th><th style="text-align:right">mL/jam</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="dc">Berlaku hanya untuk sediaan & BB di atas. Double check 2 perawat.</p>
  </div>`;
}

export function buildTherapyHtml(states, bb, patient = {}) {
  const w = num(bb);
  const aktif = DRUGS.filter((d) => states[d.id]?.on);
  let total = 0;
  const trows = aktif.map((d) => {
    const st = states[d.id];
    const r = hitung(d, st, bb);
    if (r) total += r.laju;
    const b = BOLUS[d.id];
    let bolusCell = '—';
    if (b) {
      const dv = num(st.bolusDose);
      if (dv > 0) {
        const bc = bolusCalc(b, d, st, bb, st.bolusDose);
        bolusCell = `${fmt(dv, 2)} ${b.unit}${b.label ? ` (${esc(b.label)})` : ''}`
          + `${bc && bc.vol != null ? ` = <b>${fmt(bc.vol, 2)} mL</b>` : ''}`;
      }
    }
    return `<tr><td style="text-align:left">${esc(d.nama)}</td>
      <td>${rapi(st.amt) || '—'} ${d.amtUnit} / ${rapi(st.ml) || '—'} mL</td>
      <td>${r ? konsen(r.conc) : '—'} ${d.amtUnit}/mL</td>
      <td>${isFinite(num(st.dose)) ? fmt(num(st.dose), dec(d)) : '—'} ${doseUnit(d)}</td>
      <td>${bolusCell}</td>
      <td class="rate">${r ? fmt(r.laju, 2) : '—'} mL/jam</td></tr>`;
  }).join('');

  const labels = w > 0 ? aktif.map((d) => labelCard(d, states[d.id], w, patient)).join('') : '';

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>PediDrip — Lembar Terapi</title>
  <style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#000;padding:16px;font-size:12px}
    h1{font-size:20px;margin:0}
    .subtle{color:#555;font-size:11px;margin:2px 0 14px}
    .pt{display:flex;flex-wrap:wrap;gap:6px 24px;margin-bottom:14px;font-size:12px}
    .pt b{font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:18px}
    th{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#555;text-align:right;border-bottom:2px solid #000;padding:4px 5px}
    th:first-child{text-align:left}
    td{padding:4px 5px;text-align:right;border-bottom:1px solid #ddd}
    td:first-child{text-align:left}
    tfoot td{border-top:2px solid #000;border-bottom:0;font-weight:700}
    .rate{font-weight:700}
    h2{font-size:13px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.6px}
    .labels{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .tcard{border:2px solid #000;border-radius:6px;padding:8px;page-break-inside:avoid}
    .tcard h4{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin:-8px -8px 6px;padding:6px 8px;font-size:14px;font-weight:800;text-transform:uppercase;border-radius:4px 4px 0 0}
    .tcard h4 .sw{width:18px;height:11px;border:1px solid #000;border-radius:2px;display:inline-block}
    .tcard h4 .warna{font-size:10px;font-weight:800}
    .tcard h4 .klass{font-size:9px;font-weight:600;text-transform:none;opacity:.85}
    .tid{display:flex;gap:8px;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:5px}
    .idc{flex:1}.idk{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#333}
    .idv{display:block;font-size:12px;font-weight:700;min-height:14px}
    .cx{margin:0 0 5px;font-size:11px}
    .tcard table{margin:0}.tcard th{border-bottom:1px solid #000;font-size:9px}
    .tcard td{padding:2px 4px;border-bottom:1px solid #ccc;font-size:11px}
    .dc{margin:5px 0 0;font-size:8px;color:#333}
    .warn{color:#b00;font-size:10px;margin-top:14px;border-left:3px solid #b00;padding-left:8px}
    @media print{ body{padding:0} }
  </style></head><body>
    <h1>PediDrip — Lembar Terapi Infus Kontinu</h1>
    <p class="subtle">Kalkulator infus pediatrik · PICU · Alat bantu hitung, bukan pengganti verifikasi.</p>
    <div class="pt">
      <span>Nama pasien : <b>${esc(patient.pn) || '____________'}</b></span>
      <span>No. RM : <b>${esc(patient.prm) || '__________'}</b></span>
      <span>Berat badan : <b>${w > 0 ? fmt(w, 1) : '____'} kg</b></span>
    </div>
    ${aktif.length ? `<table>
      <thead><tr><th>Obat</th><th>Sediaan</th><th>Konsentrasi</th><th>Dosis infus</th><th>Bolus / muat (sekali beri)</th><th>Laju pump</th></tr></thead>
      <tbody>${trows}</tbody>
      <tfoot><tr><td colspan="5">Total cairan dari infus kontinu</td><td class="rate">${fmt(total, 2)} mL/jam</td></tr></tfoot>
    </table>` : '<p>Belum ada obat yang dicentang.</p>'}
    ${labels ? `<h2>Kartu titrasi untuk syringe</h2><div class="labels">${labels}</div>` : ''}
    <p class="warn">Double check oleh 2 perawat sebelum obat diberikan. Kode warna ISO 26825 hanya pengingat — label fisik mengikuti kebijakan unit.</p>
  </body></html>`;
}
