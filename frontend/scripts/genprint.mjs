import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DRUGS, defaultPreset } from '../src/data/drugs.js';
import { rapi, fmt, dec } from '../src/logic/calc.js';
import { buildTherapyHtml } from '../src/printHtml.js';

const states = {};
DRUGS.forEach((d) => {
  const i = defaultPreset(d), p = d.presets[i];
  states[d.id] = {
    preset: i, amt: rapi(p.amt ?? 0), ml: rapi(p.ml), dose: fmt(d.start, dec(d)),
    on: false, open: false,
  };
});
// Worst-case therapy for layout: the drugs with the LONGEST titration tables
// (rokuronium and vasopresin 10 rows, deksmedetomidin 9, dopamin/nicardipin 8)
// plus a long patient name, so clipping regressions show up in the preview.
['rokuronium', 'deksmedetomidin', 'dopamin', 'milrinon', 'nicardipin', 'vasopresin', 'morfin', 'furosemide']
  .forEach((id) => { states[id].on = true; });

const html = buildTherapyHtml(states, '12,5', {
  pn: 'An. Budi Santoso Wijaya', prm: 'RM-123456', ptl: '01/02/2024', pt: '03/09/2026 08:00',
});
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'print-preview.html');
writeFileSync(out, html);
console.log('written', out, html.length, 'bytes');
