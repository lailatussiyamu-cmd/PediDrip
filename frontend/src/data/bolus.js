// Suggested pediatric bolus / loading doses, keyed by drug id.
// Only drugs with well-established IV bolus/loading ranges are included.
// `unit` is the display unit entered per-kg; `f` converts it to the drug's amtUnit
// (e.g. epinefrin entered in mcg/kg -> mg via f = 0.001). These are USUAL RANGES —
// always verify against unit protocol & DPJP. Given separately from the infusion.
export const BOLUS = {
  midazolam: { lo: 0.05, hi: 0.1, unit: 'mg/kg', f: 1 },
  fentanil: { lo: 1, hi: 2, unit: 'mcg/kg', f: 1 },
  morfin: { lo: 0.05, hi: 0.1, unit: 'mg/kg', f: 1 },
  deksmedetomidin: { lo: 0.5, hi: 1, unit: 'mcg/kg', f: 1, over: '10 menit', label: 'muat' },
  ketamin: { lo: 1, hi: 2, unit: 'mg/kg', f: 1, label: 'induksi' },
  vekuronium: { lo: 0.1, hi: 0.1, unit: 'mg/kg', f: 1, label: 'intubasi' },
  rokuronium: { lo: 0.6, hi: 1.2, unit: 'mg/kg', f: 1, label: 'intubasi' },
  epinefrin: { lo: 10, hi: 10, unit: 'mcg/kg', f: 0.001, label: 'henti jantung' },
  furosemide: { lo: 0.5, hi: 1, unit: 'mg/kg', f: 1 },
  aminofilin: { lo: 5, hi: 6, unit: 'mg/kg', f: 1, over: '20–30 menit', label: 'muat' },
  milrinon: { lo: 50, hi: 50, unit: 'mcg/kg', f: 0.001, over: '30–60 menit', label: 'muat' },
};
