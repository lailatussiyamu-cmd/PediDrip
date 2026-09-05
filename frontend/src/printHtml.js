// Pure HTML builder for the printable output.
// Per request: the print is JUST the titration cards, each with cutting space
// (dashed cut frame + corner crop marks + gap) so they can be cut out and taped
// onto the syringe-pump body. No native imports here.
// Explicit .js extensions so scripts/genprint.mjs can import this under plain Node
// (Metro resolves either form).
import { DRUGS, isoOf, TABEL } from './data/drugs.js';
import { fmt, rapi, tdec, titrasiDoses, doseUnit, hitung, hitungDose, effAmt, num } from './logic/calc.js';

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function labelCard(d, st, bb, patient) {
  const iso = isoOf(d);
  const r0 = hitung(d, st, bb);
  const TD = tdec(d);
  const batas = d.tblHi ?? d.hi;
  const ratio = r0 ? r0.conc / d.conv : null;
  const ratioTD = ratio !== null && ratio < 10 ? 1 : 0;
  // st.tstep carries the step the nurse picked on the card, so the label taped to
  // the pump lists exactly the rows she was reading on screen.
  const rows = titrasiDoses(d, batas, st.tstep).map((dose) => {
    const rr = hitungDose(d, st, bb, dose);
    const ext = dose > d.hi ? ' style="background:#fff8e1"' : '';
    return `<tr${ext}><td>${fmt(dose, TD)}</td><td style="text-align:right">${rr ? fmt(rr.laju, 2) : '—'}</td></tr>`;
  }).join('');
  // The whole header band is already printed in the ISO colour, so a swatch of the
  // same colour on top of it was invisible (it printed as an empty white box).
  const head = iso ? `LABEL ${iso.warna.toUpperCase()}` : 'TIDAK DIATUR ISO';
  const idCell = (k, v, grow = 1) => `<div class="idc" style="flex:${grow}"><span class="idk">${k}</span><span class="idv">${v ? esc(v) : '&nbsp;'}</span></div>`;

  const amt = rapi(effAmt(d, st, bb));

  return `<div class="cut">
    <span class="cm tl"></span><span class="cm tr"></span><span class="cm bl"></span><span class="cm br"></span>
    <div class="tcard" style="border-color:${iso ? iso.hex : '#999'}">
      <h4 style="background:${iso ? iso.hex : '#eee'}">${esc(d.nama)} <span class="warna">${head}</span> <span class="klass">${esc(d.klass)}</span></h4>
      <div class="tid">${idCell('Nama pasien', patient.pn, 2)}${idCell('No. RM', patient.prm, 1)}${idCell('Tgl lahir', patient.ptl, 1)}</div>
      <p class="cx"><b>BB ${rapi(bb) || '—'} kg</b> · Sediaan ${amt || '—'} ${d.amtUnit}/${rapi(st.ml) || '—'} mL · Titrasi 1 mL : ${ratio !== null ? fmt(ratio, ratioTD) : '—'} ${d.numer}</p>
      <table><thead><tr><th>Dosis (${doseUnit(d)})</th><th style="text-align:right">mL/jam</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="dc">Berlaku hanya untuk sediaan &amp; BB di atas. Double check 2 perawat.${patient.pt ? ` · ${esc(patient.pt)}` : ''} · Tabel dosis v${esc(TABEL.versi)}</p>
    </div>
  </div>`;
}

export function buildTherapyHtml(states, bb, patient = {}) {
  const w = num(bb);
  const aktif = DRUGS.filter((d) => states[d.id]?.on);
  const ready = w > 0 && aktif.length > 0;
  const cards = ready ? aktif.map((d) => labelCard(d, states[d.id], w, patient)).join('') : '';

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>PediDrip — Kartu Titrasi</title>
  <style>
    @page{ size:A4 portrait; margin:8mm; }
    *{box-sizing:border-box}
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#000;font-size:11px;margin:0;padding:0}
    /* 6 label POTRAIT per halaman A4: 2 kolom x 3 baris, tiap label 72 x 88 mm.
       Tinggi 88mm adalah MINIMUM, bukan batas: obat dengan tabel titrasi panjang
       (mis. rokuronium 3-12) boleh tumbuh ke bawah. Sebelumnya kartu dipaksa 88mm
       dengan overflow:hidden sehingga baris dosis tertinggi & disclaimer terpotong
       diam-diam. */
    .labels{display:grid;grid-template-columns:repeat(2,72mm);justify-content:center;column-gap:16mm;row-gap:8mm;grid-auto-rows:minmax(88mm,auto)}
    /* dashed cut frame with room around the card for scissors + tape */
    .cut{position:relative;min-height:88mm;border:1px dashed #9aa0a6;border-radius:3mm;padding:4mm;page-break-inside:avoid;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    /* corner crop marks to guide a precise cut */
    .cm{position:absolute;width:3.5mm;height:3.5mm}
    .cm.tl{top:-1px;left:-1px;border-top:1px solid #000;border-left:1px solid #000}
    .cm.tr{top:-1px;right:-1px;border-top:1px solid #000;border-right:1px solid #000}
    .cm.bl{bottom:-1px;left:-1px;border-bottom:1px solid #000;border-left:1px solid #000}
    .cm.br{bottom:-1px;right:-1px;border-bottom:1px solid #000;border-right:1px solid #000}
    .tcard{border:2px solid #000;border-radius:4px;padding:7px;min-height:100%;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    /* Type/padding tuned so even the longest table (rokuronium, 10 rows) still fits
       inside 88mm and A4 keeps 6 labels per page. */
    .tcard h4{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin:-7px -7px 4px;padding:4px 7px;font-size:11px;font-weight:800;text-transform:uppercase;border-radius:3px 3px 0 0;line-height:1.2}
    .tcard h4 .warna{font-size:8.5px;font-weight:800}
    .tcard h4 .klass{font-size:8px;font-weight:600;text-transform:none;opacity:.85;width:100%}
    .tid{display:flex;gap:6px;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:3px}
    .idc{min-width:0}.idk{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.4px;color:#333;line-height:1.2}
    .idv{display:block;font-size:10px;font-weight:700;min-height:11px;line-height:1.2}
    .cx{margin:0 0 3px;font-size:8.5px;line-height:1.25}
    table{width:100%;border-collapse:collapse;margin:0}
    th{font-size:8px;text-transform:uppercase;letter-spacing:.3px;color:#333;text-align:left;border-bottom:1px solid #000;padding:1px 4px;line-height:1.2}
    td{padding:0.2px 4px;border-bottom:1px solid #ccc;font-size:10px;line-height:1.2}
    td:last-child{text-align:right;font-weight:700}
    .dc{margin:auto 0 0;padding-top:2px;font-size:7px;color:#333;line-height:1.2}
    .empty{color:#b00;font-size:13px}
  </style></head><body>
    ${ready
      ? `<div class="labels">${cards}</div>`
      : `<p class="empty">Isi berat badan dan centang minimal satu obat (Masukkan ke lembar terapi) untuk mencetak kartu titrasi.</p>`}
  </body></html>`;
}
