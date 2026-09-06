// Pure HTML builder for the printable output.
// Per request: the print is JUST the titration cards, each with corner crop
// marks and a gap so they can be cut out and taped onto the syringe-pump body.
// No native imports here.
//
// This must match the print stylesheet in the root index.html, which is the
// build nurses actually use. A card printed from the app and a card printed
// from the web page end up taped to two pumps at the same bedside; if they do
// not look alike, the difference reads as "these are different numbers".
// Explicit .js extensions so scripts/genprint.mjs can import this under plain Node
// (Metro resolves either form).
import { DRUGS, isoOf, TABEL } from './data/drugs.js';
import { fmt, rapi, tdec, titrasiDoses, doseUnit, hitung, hitungDose, effAmt, num, lajuTerlaluPelan, LAJU_MIN } from './logic/calc.js';

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
  // Dua penandaan, dua arah. Yang di atas rentang lazim sudah lama ditandai;
  // yang di bawah kemampuan pump belum, padahal kartu inilah satu-satunya
  // lembar yang benar-benar dibaca di samping pump.
  let adaPelan = false;
  const rows = titrasiDoses(d, batas, st.tstep).map((dose) => {
    const rr = hitungDose(d, st, bb, dose);
    const pelan = !!(rr && lajuTerlaluPelan(rr.laju));
    if (pelan) adaPelan = true;
    // Penandanya bukan sekadar warna latar: kartu ini harus tetap terbaca kalau
    // dicetak hitam-putih atau tanpa background graphics, dan krem maupun kelabu
    // sama saja hilangnya di situ.
    const bg = dose > d.hi ? ' style="background:#fff8e1"' : pelan ? ' style="background:#ededed;color:#333"' : '';
    const tanda = dose > d.hi ? '▲ ' : pelan ? '▼ ' : '';
    return `<tr${bg}><td>${tanda}${fmt(dose, TD)}</td><td style="text-align:right">${rr ? fmt(rr.laju, 2) : '—'}</td></tr>`;
  }).join('');
  // Petak putih + nama warna, persis seperti index.html. Petak itu memang tidak
  // membawa warna apa pun (pitanya sudah berwarna ISO), tapi kartu web sudah
  // dipakai perawat dalam bentuk itu dan Lala memilih mempertahankannya — jadi
  // yang menyesuaikan build ini, bukan sebaliknya. Dua build yang berbeda
  // tampilannya lebih mahal daripada satu petak yang tidak berguna.
  // Kata-katanya juga disamakan: dua kartu di satu bedside yang bertulis
  // "LABEL BIRU" dan "BIRU" mengundang pertanyaan apakah artinya sama.
  const head = iso ? iso.warna.toUpperCase() : 'TIDAK DIATUR';
  // Sama seperti index.html: yang mengalah ukuran hurufnya, bukan isinya.
  // Nomor RM lebih ketat karena kolomnya lebih sempit, dan nomor yang patah di
  // tengah bisa terbaca sebagai nomor lain.
  const kelasNama = (n) => (n.length <= 24 ? '' : n.length <= 34 ? ' nm-sedang' : n.length <= 44 ? ' nm-kecil' : ' nm-mini');
  const kelasRM = (n) => (n.length <= 9 ? '' : n.length <= 13 ? ' nm-sedang' : n.length <= 18 ? ' nm-kecil' : ' nm-mini');
  const idCell = (k, v, grow = 1, rm = false) =>
    `<div class="idc" style="flex:${grow}"><span class="idk">${k}</span>`
    + `<span class="idv${v ? (rm ? kelasRM(v) : kelasNama(v)) : ''}">${v ? esc(v) : '&nbsp;'}</span></div>`;

  const amt = rapi(effAmt(d, st, bb));

  return `<div class="cut">
    <span class="cm tl"></span><span class="cm tr"></span><span class="cm bl"></span><span class="cm br"></span>
    <div class="tcard" style="border-color:${iso ? iso.hex : '#999'}">
      <h4 style="background:${iso ? iso.hex : '#eee'}">${esc(d.nama)} <span class="sw"></span> <span class="warna">${head}</span></h4>
      <div class="tid">${idCell('Nama pasien', patient.pn, 1.6)}${idCell('No. RM', patient.prm, 1, true)}</div>
      <p class="cx"><b>BB ${rapi(bb) || '—'} kg</b> · Titrasi 1 mL : ${ratio !== null ? fmt(ratio, ratioTD) : '—'} ${d.numer}</p>
      <table><thead><tr><th>Dosis (${doseUnit(d)})</th><th style="text-align:right">mL/jam</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="dc">${batas > d.hi ? `Baris ▲ di atas ${fmt(d.hi, TD)}: hanya atas instruksi DPJP. ` : ''}${adaPelan ? `Baris ▼ di bawah ${fmt(LAJU_MIN, 1)} mL/jam: pump sulit akurat, encerkan lagi. ` : ''}<b>Double check 2 perawat.</b> Sesuai sediaan ${amt || '—'} ${esc(d.amtUnit)}/${rapi(st.ml) || '—'} mL &amp; BB di atas. v${esc(TABEL.versi)}</p>
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
    @page{ size:A4 portrait; margin:6mm; }
    *{box-sizing:border-box}
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#000;font-size:8pt;margin:0;padding:0}

    /* Sembilan kartu per halaman A4: 3 kolom x 3 baris, tiap kartu DIKUNCI
       60 x 90 mm. Penguncian itu yang penting. Sebelumnya tinggi kartu
       mengikuti isinya, jadi vasopresin (10 baris) tercetak jauh lebih tinggi
       daripada fentanil (5 baris) dan setumpuk kartu hasil guntingan untuk satu
       pasien keluar bermacam-macam ukuran.
       Selisihnya diserap oleh deret titrasi: tabel dibuat melar mengisi ruang
       sisa, sehingga obat berbaris sedikit justru berbaris lebih lega, bukan
       menyisakan ruang kosong di bawah kartu. */
    .labels{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:90mm;
            align-content:start;gap:5mm}
    .cut{position:relative;height:90mm;page-break-inside:avoid;break-inside:avoid}

    /* Tanda potong duduk DI LUAR kartu, jadi .cut tidak boleh overflow:hidden —
       yang tergunting justru panduan guntingnya. */
    .cm{position:absolute;width:3mm;height:3mm}
    .cm.tl{top:-1.6mm;left:-1.6mm;border-top:0.75pt solid #000;border-left:0.75pt solid #000}
    .cm.tr{top:-1.6mm;right:-1.6mm;border-top:0.75pt solid #000;border-right:0.75pt solid #000}
    .cm.bl{bottom:-1.6mm;left:-1.6mm;border-bottom:0.75pt solid #000;border-left:0.75pt solid #000}
    .cm.br{bottom:-1.6mm;right:-1.6mm;border-bottom:0.75pt solid #000;border-right:0.75pt solid #000}

    .tcard{height:100%;display:flex;flex-direction:column;
           border:2pt solid #000;border-radius:2mm;padding:2.4mm;
           line-height:1.28;-webkit-print-color-adjust:exact;print-color-adjust:exact}

    /* Pita warna ISO 26825 selebar kartu. Nama golongan obat dibuang di
       cetakan: warna dan nama obat sudah menyampaikan hal yang sama, dan ruang
       itu lebih berguna untuk nama obatnya sendiri. Nama warna tetap ditulis
       supaya kartu yang dicetak hitam-putih masih punya penanda golongan. */
    .tcard h4{flex:none;display:flex;align-items:center;flex-wrap:wrap;gap:1.2mm;
              margin:-2.4mm -2.4mm 1.6mm;padding:1.8mm 2.4mm;
              font-size:11.8pt;font-weight:800;line-height:1.12;
              text-transform:uppercase;letter-spacing:-.015em;border-radius:1.5mm 1.5mm 0 0}
    .tcard h4 .sw{width:5.5mm;height:3.2mm;border:0.75pt solid #000;border-radius:0.8mm;flex:none;
                  background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .tcard h4 .warna{font-size:6.8pt;font-weight:800;flex:none}

    /* Identitas dinaikkan, bukan diturunkan: kartu yang sudah digunting harus
       tetap jelas miliknya siapa. Nama boleh turun ke baris kedua — memotongnya
       dengan elipsis lebih rapi tapi salah di bangsal. */
    .tid{flex:none;display:flex;gap:2mm;border-bottom:1.2pt solid #000;
         padding-bottom:1.1mm;margin-bottom:1.3mm}
    .idc{min-width:0}
    .idk{display:block;font-size:5.8pt;font-weight:700;text-transform:uppercase;
         letter-spacing:.1em;color:#000;line-height:1.2}
    .idv{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
         font-size:9.6pt;font-weight:800;line-height:1.14;min-height:4.1mm;word-break:break-word}
    .idv.nm-sedang{font-size:8.4pt;line-height:1.1}
    .idv.nm-kecil{font-size:7pt;line-height:1.08}
    .idv.nm-mini{font-size:5.9pt;line-height:1.06;letter-spacing:-.01em}
    .idc:last-child .idv{word-break:normal;overflow-wrap:normal}

    /* Satu baris, tidak boleh patah: kalau melipat, tinggi kartu ikut berubah. */
    .cx{flex:none;margin:0 0 1.2mm;font-size:6.6pt;color:#333;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cx b{font-size:9.5pt;font-weight:800;color:#000}

    /* Deret titrasi adalah alasan kartu ini ada. */
    table{flex:1 1 auto;width:100%;border-collapse:collapse;margin:0}
    th{font-size:6.2pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
       text-align:left;border-bottom:1.2pt solid #000;padding:0.4mm 0.8mm;height:4mm}
    td{padding:0.3mm 0.8mm;border-bottom:0.5pt solid #bbb;
       font-size:9.2pt;font-weight:700;line-height:1.12;font-variant-numeric:tabular-nums}
    td:last-child{text-align:right;font-weight:800}
    tbody tr:last-child td{border-bottom:none}

    .dc{flex:none;margin:1mm 0 0.4mm;font-size:6pt;line-height:1.16;color:#000}
    .empty{color:#b00;font-size:13px}
  </style></head><body>
    ${ready
      ? `<div class="labels">${cards}</div>`
      : `<p class="empty">Isi berat badan dan centang minimal satu obat (Masukkan ke lembar terapi) untuk mencetak kartu titrasi.</p>`}
  </body></html>`;
}
