// Drug definitions ported verbatim from PediDrip index.html (CREATED BY THE URBAN MAMA-2026).
// Units are kept generic so mcg/kg/min, mcg/kg/hr and unit/kg/hr are all supported.
export const DRUGS = [
  /* --- sedasi, analgesia, relaksan --- */
  { id: 'midazolam', badge: 'benzo', nama: 'Midazolam', klass: 'Benzodiazepin — sedasi', band: 'var(--benzo)', grup: 'sedasi',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 1, hi: 6, cap: 10, step: 0.1, start: 1, tstep: 1,
    presets: [
      { t: '1 mg/mL — 50 mg dalam 50 mL', amt: 50, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 },
      { t: '0,5 mg/mL — 25 mg dalam 50 mL', amt: 25, ml: 50 },
      { t: 'Tanpa pengenceran — 5 mg/mL', amt: 50, ml: 10 }],
    note: 'Sedasi 1–4 mcg/kg/menit (setara 0,06–0,24 mg/kg/jam), titrasi sesuai skor sedasi. Awasi depresi napas dan hipotensi, terutama bila dikombinasi opioid. Neonatus lebih sensitif — mulai dari dosis terendah.' },

  { id: 'fentanil', badge: 'opioid', nama: 'Fentanil', klass: 'Opioid — analgesia', band: 'var(--opioid)', grup: 'sedasi',
    amtUnit: 'mcg', numer: 'mcg', perMin: false, conv: 1,
    lo: 1, hi: 5, cap: 10, step: 0.1, start: 1, tstep: 1,
    presets: [
      { t: '10 mcg/mL — 500 mcg dalam 50 mL', amt: 500, ml: 50 },
      { t: '20 mcg/mL — 1000 mcg dalam 50 mL', amt: 1000, ml: 50 },
      { t: '5 mcg/mL — 250 mcg dalam 50 mL', amt: 250, ml: 50 },
      { t: 'Tanpa pengenceran — 50 mcg/mL', amt: 500, ml: 10 }],
    note: 'Infus kontinu 1–5 mcg/kg/jam, titrasi sesuai skor nyeri dan sedasi. Dosis bolus (1–2 mcg/kg) diberikan terpisah. Bolus cepat dapat memicu rigiditas dinding dada. Pemakaian lama menimbulkan toleransi dan gejala putus obat — turunkan bertahap.' },

  { id: 'morfin', badge: 'opioid', nama: 'Morfin', klass: 'Opioid — analgesia', band: 'var(--opioid)', grup: 'sedasi',
    amtUnit: 'mg', numer: 'mcg', perMin: false, conv: 0.001,
    lo: 10, hi: 40, cap: 60, step: 1, start: 10, tstep: 5,
    presets: [
      { t: '1 mg/mL — 50 mg dalam 50 mL', amt: 50, ml: 50 },
      { t: '0,5 mg/mL — 25 mg dalam 50 mL', amt: 25, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 },
      { t: '0,1 mg/mL — 5 mg dalam 50 mL (neonatus)', amt: 5, ml: 50 }],
    note: 'Infus kontinu 10–40 mcg/kg/jam (0,01–0,04 mg/kg/jam). Neonatus mulai 5–10 mcg/kg/jam karena klirens belum matang. Awasi depresi napas, hipotensi, dan pelepasan histamin. Turunkan bertahap setelah pemakaian lama.' },

  { id: 'deksmedetomidin', badge: 'alpha', nama: 'Deksmedetomidin', klass: 'Agonis alfa-2 — sedasi', band: 'var(--alpha)', grup: 'sedasi',
    amtUnit: 'mcg', numer: 'mcg', perMin: false, conv: 1,
    lo: 0.2, hi: 1, cap: 1.5, step: 0.05, start: 0.4, tstep: 0.1,
    presets: [
      { t: '4 mcg/mL — 200 mcg dalam 50 mL', amt: 200, ml: 50 },
      { t: '8 mcg/mL — 400 mcg dalam 50 mL', amt: 400, ml: 50 },
      { t: '2 mcg/mL — 100 mcg dalam 50 mL', amt: 100, ml: 50 }],
    note: 'Rumatan 0,2–1 mcg/kg/jam. Dosis muat (0,5–1 mcg/kg selama 10 menit) sering dilewati pada anak karena memicu bradikardia dan hipotensi. Pantau laju jantung dan tekanan darah; sedasi tanpa depresi napas berarti.' },

  { id: 'ketamin', badge: 'induksi', nama: 'Ketamin', klass: 'Sedasi — analgesia', band: 'var(--induksi)', grup: 'sedasi',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 1, hi: 6, cap: 10, step: 1, start: 1, doses: [1, 2, 3, 4, 5, 6],
    presets: [
      { t: '10 mg/mL — 500 mg dalam 50 mL', amt: 500, ml: 50 },
      { t: '5 mg/mL — 250 mg dalam 50 mL', amt: 250, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 },
      { t: '1 mg/mL — 50 mg dalam 50 mL', amt: 50, ml: 50 }],
    note: 'Sedasi dan analgesia 1–6 mcg/kg/menit (setara 0,06–0,36 mg/kg/jam). Relatif mempertahankan tekanan darah dan bersifat bronkodilator, berguna pada status asmatikus dan syok. Hipersalivasi dan fenomena emergensi mungkin muncul; pertimbangkan kombinasi benzodiazepin.' },

  { id: 'vekuronium', badge: 'relax', nama: 'Vekuronium', klass: 'Relaksan otot', band: 'var(--relax)', grup: 'sedasi',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 0.8, hi: 1.7, cap: 3, step: 0.1, start: 1, tstep: 0.2,
    presets: [
      { t: '1 mg/mL — 50 mg dalam 50 mL', amt: 50, ml: 50 },
      { t: '0,4 mg/mL — 20 mg dalam 50 mL', amt: 20, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 }],
    note: 'WAJIB disertai sedasi dan analgesia adekuat serta ventilasi mekanik — relaksan tidak memberi efek sedasi maupun analgesia. Rumatan 0,8–1,7 mcg/kg/menit (0,05–0,1 mg/kg/jam). Pantau kedalaman blokade dengan TOF dan hentikan berkala untuk menilai kesadaran.' },

  { id: 'rokuronium', badge: 'relax', nama: 'Rokuronium', klass: 'Relaksan otot', band: 'var(--relax)', grup: 'sedasi',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 3, hi: 12, cap: 20, step: 0.5, start: 5, tstep: 1,
    presets: [
      { t: '5 mg/mL — 250 mg dalam 50 mL', amt: 250, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 },
      { t: 'Tanpa pengenceran — 10 mg/mL', amt: 500, ml: 50 }],
    note: 'WAJIB disertai sedasi dan analgesia adekuat serta ventilasi mekanik. Rumatan 3–12 mcg/kg/menit (0,18–0,72 mg/kg/jam). Pantau TOF. Awasi akumulasi pada gangguan hati dan ginjal.' },

  /* --- vasoaktif & inotropik --- */
  { id: 'epinefrin', badge: 'vaso', nama: 'Epinefrin', klass: 'Vasopresor / inotropik', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 0.05, hi: 0.3, cap: 1, step: 0.01, start: 0.05, tstep: 0.05,
    presets: [
      { t: 'Rule of 0,6 — 1 mL/jam = 0,1 mcg/kg/menit', amtPerKg: 0.3, ml: 50 },
      { t: '20 mcg/mL — 1 mg dalam 50 mL', amt: 1, ml: 50 },
      { t: '40 mcg/mL — 2 mg dalam 50 mL', amt: 2, ml: 50 },
      { t: '80 mcg/mL — 4 mg dalam 50 mL', amt: 4, ml: 50 }],
    note: 'Mulai 0,05 mcg/kg/menit dan titrasi naik; rentang lazim 0,05–0,3 mcg/kg/menit, dapat dinaikkan sampai 1 mcg/kg/menit pada syok refrakter. Utamakan akses sentral. Dosis bolus henti jantung (0,01 mg/kg) berbeda dan tidak dihitung di sini.' },

  { id: 'norepinefrin', badge: 'vaso', nama: 'Norepinefrin', klass: 'Vasopresor', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 0.05, hi: 0.3, cap: 1, step: 0.01, start: 0.05, tstep: 0.05, tblHi: 0.5,
    presets: [
      { t: 'Rule of 0,6 — 1 mL/jam = 0,1 mcg/kg/menit', amtPerKg: 0.3, ml: 50 },
      { t: '80 mcg/mL — 4 mg dalam 50 mL', amt: 4, ml: 50 },
      { t: '160 mcg/mL — 8 mg dalam 50 mL', amt: 8, ml: 50 },
      { t: '40 mcg/mL — 2 mg dalam 50 mL', amt: 2, ml: 50 }],
    note: 'Mulai 0,05 mcg/kg/menit, titrasi sesuai target MAP menurut usia; rentang lazim 0,05–0,3 mcg/kg/menit, dapat dinaikkan sampai 1 mcg/kg/menit pada syok refrakter. Berikan lewat akses sentral bila memungkinkan karena risiko nekrosis bila ekstravasasi.' },

  { id: 'dopamin', badge: 'vaso', nama: 'Dopamin', klass: 'Vasopresor / inotropik', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 3, hi: 20, cap: 30, step: 0.5, start: 5, tstep: 2.5,
    presets: [
      { t: 'Rule of 6 — 1 mL/jam = 1 mcg/kg/menit', amtPerKg: 3, ml: 50 },
      { t: '4 mg/mL — 200 mg dalam 50 mL', amt: 200, ml: 50 },
      { t: '8 mg/mL — 400 mg dalam 50 mL', amt: 400, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 }],
    note: 'Rentang lazim 3–20 mcg/kg/menit; efek bergeser dari inotropik ke vasokonstriksi seiring naiknya dosis. Di atas 20 mcg/kg/menit vasokonstriksi dominan. Ekstravasasi berisiko nekrosis — utamakan akses sentral.' },

  { id: 'dobutamin', badge: 'vaso', nama: 'Dobutamin', klass: 'Inotropik', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 3, hi: 20, cap: 40, step: 0.5, start: 5, tstep: 2.5,
    presets: [
      { t: 'Rule of 6 — 1 mL/jam = 1 mcg/kg/menit', amtPerKg: 3, ml: 50 },
      { t: '5 mg/mL — 250 mg dalam 50 mL', amt: 250, ml: 50 },
      { t: '10 mg/mL — 500 mg dalam 50 mL', amt: 500, ml: 50 },
      { t: '2,5 mg/mL — 125 mg dalam 50 mL', amt: 125, ml: 50 }],
    note: 'Rentang lazim 3–20 mcg/kg/menit. Di atas 20 mcg/kg/menit risiko takiaritmia meningkat. Pantau nadi, irama, dan perfusi.' },

  { id: 'milrinon', badge: 'vaso', nama: 'Milrinon', klass: 'Inodilator', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 0.25, hi: 2, cap: 2.5, step: 0.05, start: 0.25, tstep: 0.25,
    presets: [
      { t: '200 mcg/mL — 10 mg dalam 50 mL', amt: 10, ml: 50 },
      { t: '100 mcg/mL — 5 mg dalam 50 mL', amt: 5, ml: 50 },
      { t: '400 mcg/mL — 20 mg dalam 50 mL', amt: 20, ml: 50 }],
    note: 'Rumatan 0,25–0,75 mcg/kg/menit. Bersifat vasodilator — hipotensi mungkin muncul, terutama bila volume intravaskular kurang. Ekskresi lewat ginjal: turunkan dosis pada gangguan fungsi ginjal karena mudah menumpuk.' },

  { id: 'vasopresin', badge: 'vaso', nama: 'Vasopresin', klass: 'Vasopresor', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'unit', numer: 'unit', perMin: false, conv: 1,
    lo: 0.05, hi: 0.15, cap: 0.3, step: 0.01, start: 0.05, tstep: 0.05,
    presets: [
      { t: '1 unit/mL — 50 unit dalam 50 mL', amt: 50, ml: 50 },
      { t: '0,4 unit/mL — 20 unit dalam 50 mL', amt: 20, ml: 50 },
      { t: '2 unit/mL — 100 unit dalam 50 mL', amt: 100, ml: 50 }],
    note: 'Dosis dinyatakan dalam unit/kg/jam: rentang lazim 0,05–0,15 unit/kg/jam. Dipakai sebagai tambahan pada syok vasodilatasi yang tidak responsif katekolamin. Pantau perfusi distal, natrium, dan keluaran urine; risiko iskemia jari dan kulit.' },

  /* --- diuretik --- */
  { id: 'furosemide', badge: 'diur', nama: 'Furosemide', klass: 'Diuretik loop', band: 'var(--diur)', grup: 'lain',
    amtUnit: 'mg', numer: 'mg', perMin: false, conv: 1,
    lo: 0.1, hi: 0.7, cap: 0.8, step: 0.01, start: 0.1, tstep: 0.1,
    presets: [
      { t: '1 mg/mL — 50 mg dalam 50 mL', amt: 50, ml: 50 },
      { t: '2 mg/mL — 100 mg dalam 50 mL', amt: 100, ml: 50 },
      { t: '0,5 mg/mL — 25 mg dalam 50 mL', amt: 25, ml: 50 },
      { t: 'Tanpa pengenceran — 10 mg/mL', amt: 100, ml: 10 }],
    note: 'Infus kontinu 0,1–0,4 mg/kg/jam. Dosis bolus awal (0,5–1 mg/kg) diberikan terpisah dan tidak dihitung di sini. Pantau balans cairan, kalium, natrium, dan fungsi ginjal.' },

  /* --- endokrin / metabolik --- */
  { id: 'insulin', badge: 'horm', nama: 'Insulin', klass: 'Hormon — kontrol glukosa', band: 'var(--diur)', grup: 'lain',
    amtUnit: 'unit', numer: 'unit', perMin: false, conv: 1,
    lo: 0.05, hi: 0.1, cap: 0.15, step: 0.01, start: 0.05, doses: [0.05, 0.06, 0.07, 0.08, 0.09, 0.1],
    presets: [
      { t: '1 unit/mL — 50 unit dalam 50 mL', amt: 50, ml: 50 },
      { t: '0,5 unit/mL — 25 unit dalam 50 mL', amt: 25, ml: 50 },
      { t: '0,1 unit/mL — 5 unit dalam 50 mL', amt: 5, ml: 50 }],
    note: 'Dosis dinyatakan dalam unit/kg/jam: mulai 0,05 unit/kg/jam, titrasi sesuai protokol dan target gula darah unit. Insulin melekat pada dinding selang plastik — bilas/priming set infus sebelum disambung ke pasien. Pantau gula darah berkala dan kalium; obat kewaspadaan tinggi, double check 2 perawat.' },

  { id: 'aminofilin', badge: 'resp', nama: 'Aminofilin', klass: 'Bronkodilator — metilxantin', band: 'var(--diur)', grup: 'lain',
    amtUnit: 'mg', numer: 'mg', perMin: false, conv: 1,
    lo: 0.5, hi: 1.75, cap: 2, step: 0.05, start: 0.5, doses: [0.5, 0.75, 1, 1.5, 1.75],
    presets: [
      { t: 'Tanpa pengenceran — 24 mg/mL (ampul 240 mg/10 mL)', amt: 240, ml: 10 }],
    note: 'Rumatan mulai 0,5 mg/kg/jam, titrasi tiap 0,5 mg/kg/jam sesuai respons dan kadar teofilin bila tersedia. Dosis muat (loading dose) diberikan terpisah dan tidak dihitung di sini. Awasi takikardia, aritmia, mual, dan kejang pada kadar toksik; jendela terapi sempit.' },

  { id: 'nicardipin', badge: 'vaso', nama: 'Nicardipin', klass: 'Antihipertensi — CCB', band: 'var(--vaso)', grup: 'vaso',
    amtUnit: 'mg', numer: 'mcg', perMin: true, conv: 0.001,
    lo: 0.5, hi: 4, cap: 5, step: 0.05, start: 0.5, tstep: 0.5,
    presets: [
      { t: 'Tanpa pengenceran — 1000 mcg/mL (ampul 25 mg/25 mL)', amt: 25, ml: 25 },
      { t: '1:400 (bayi) — 400 mcg/mL, 20 mg dalam 50 mL', amt: 20, ml: 50 },
      { t: '1:500 (bayi) — 500 mcg/mL, 25 mg dalam 50 mL', amt: 25, ml: 50 }],
    note: 'Mulai 0,5 mcg/kg/menit, titrasi sesuai target tekanan darah. Pada bayi pengenceran 1:400 atau 1:500 mcg/mL lazim dipakai agar laju infus lebih terukur. Utamakan akses sentral bila memungkinkan; ekstravasasi berisiko iritasi jaringan.' },
];

// ISO 26825 syringe-label colour code (only for classes the standard defines).
export const ISO = {
  induksi: { warna: 'Kuning', hex: '#F5E14B', gol: 'Agen induksi' },
  benzo: { warna: 'Oranye', hex: '#FF8200', gol: 'Benzodiazepin' },
  opioid: { warna: 'Biru', hex: '#71C5E8', gol: 'Opioid' },
  relax: { warna: 'Merah', hex: '#FF3C5F', gol: 'Relaksan otot' },
  vaso: { warna: 'Ungu', hex: '#C9A0DC', gol: 'Vasopresor / vasoaktif' },
};
export const isoOf = (d) => ISO[d.badge] || null;

export const GRUP = [
  { id: 'sedasi', judul: 'Sedasi, analgesia & relaksan' },
  { id: 'vaso', judul: 'Vasoaktif & inotropik' },
  { id: 'lain', judul: 'Diuretik & lainnya' },
];

export const byId = (id) => DRUGS.find((d) => d.id === id);
