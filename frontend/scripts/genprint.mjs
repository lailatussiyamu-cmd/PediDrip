import { writeFileSync } from 'fs';
import { DRUGS } from '../src/data/drugs.js';
import { BOLUS } from '../src/data/bolus.js';
import { rapi, fmt, dec } from '../src/logic/calc.js';
import { buildTherapyHtml } from '../src/printHtml.js';

const states = {};
DRUGS.forEach((d) => {
  const p = d.presets[0];
  const b = BOLUS[d.id];
  states[d.id] = {
    preset: 0, amt: rapi(p.amt ?? 0), ml: rapi(p.ml), dose: fmt(d.start, dec(d)),
    on: false, open: false, bolusDose: b ? String(b.lo).replace('.', ',') : '',
  };
});
// A representative therapy: sedation + opioid + a weight-based pressor + a diuretic
['midazolam', 'fentanil', 'epinefrin', 'furosemide'].forEach((id) => { states[id].on = true; });

const html = buildTherapyHtml(states, '12', { pn: 'An. Budi', prm: 'RM-123456' });
writeFileSync('/app/frontend/public/print-preview.html', html);
console.log('written public/print-preview.html', html.length, 'bytes');
