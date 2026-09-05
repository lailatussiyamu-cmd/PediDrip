import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { F, makeBadge, bandColor, useTheme } from '../theme';
import { isoOf } from '../data/drugs';
import {
  num, saring, fmt, rapi, konsen, dec, tdec, titrasiDoses,
  doseUnit, setaraUnit, setaraValue, effAmt, isWeightBased, hitung, hitungDose, status,
  lajuTerlaluPelan, LAJU_MIN,
} from '../logic/calc';

export default function DrugCard({ d, st, bb, onPatch, saved = [], onSaveCurrent, onDeleteSaved }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const NOTE_CLR = { low: C.ink3, in: C.ink3, high: C.warning, over: C.danger };
  const [presetOpen, setPresetOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const band = bandColor(d, C);
  const badge = makeBadge(C)[d.badge] || makeBadge(C).diur;
  const iso = isoOf(d);
  const D = dec(d);
  const r = hitung(d, st, bb);
  const wb = isWeightBased(d, st);
  const amtDisplay = wb ? rapi(effAmt(d, st, bb)) : st.amt;
  const [cls, txt] = status(d, st.dose);
  const sv = r ? setaraValue(d, r.setara) : NaN;
  const doseNum = num(st.dose);
  const isRelax = d.badge === 'relax';
  const canSave = !wb && num(st.amt) > 0 && num(st.ml) > 0;

  const bandL = (d.lo / d.cap) * 100;
  const bandW = Math.max(0, ((Math.min(d.hi, d.cap) - d.lo) / d.cap) * 100);
  const pinL = Math.min(100, Math.max(0, ((isFinite(doseNum) ? doseNum : 0) / d.cap) * 100));
  const presetLabel = st.preset >= 0 ? d.presets[st.preset].t : 'Sediaan lain (isi sendiri)';

  const pickPreset = (i) => {
    setPresetOpen(false);
    if (i < 0) { onPatch({ preset: -1 }); return; }
    const p = d.presets[i];
    const patch = { preset: i, ml: rapi(p.ml) };
    if (p.amt !== undefined) patch.amt = rapi(p.amt);
    onPatch(patch);
  };
  const pickSaved = (p) => { setPresetOpen(false); onPatch({ amt: rapi(p.amt), ml: rapi(p.ml), preset: -1 }); };

  // Concentration is amount / volume — it does not depend on body weight, so show it
  // as soon as the syringe is described (the nurse mixes before the weight is typed).
  const concText = () => {
    const a = effAmt(d, st, bb), v = num(st.ml);
    const conc = a > 0 && v > 0 ? a / v : NaN;
    if (!isFinite(conc) || conc <= 0) {
      return wb && !(num(bb) > 0)
        ? 'Konsentrasi — sediaan ini dihitung dari berat badan'
        : 'Konsentrasi — lengkapi jumlah obat & volume';
    }
    let s = `Konsentrasi ${konsen(conc)} ${d.amtUnit}/mL`;
    if (d.amtUnit === 'mg') s += `  ·  ${fmt(conc * 1000, 0)} mcg/mL`;
    if (d.amtUnit === 'unit') s += `  ·  ${fmt(conc * 1000, 0)} mU/mL`;
    return s;
  };

  return (
    <View style={[styles.card, isRelax && styles.cardRelax, !bb && styles.idle]}>
      <View style={[styles.band, { backgroundColor: band }]} />

      <TouchableOpacity activeOpacity={0.7} onPress={() => onPatch({ open: !st.open })} style={styles.chead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{d.nama}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeTxt, { color: badge.fg }]}>{d.klass}</Text>
          </View>
          <View style={styles.isoLine}>
            <View style={[styles.sw, { backgroundColor: iso ? iso.hex : 'transparent', borderColor: C.ink3 }]} />
            {iso ? (
              <Text style={styles.isoTxt}>Label syringe <Text style={styles.isoB}>{iso.warna}</Text> · {iso.gol}</Text>
            ) : (
              <Text style={styles.isoTxt}>Tidak diatur ISO 26825 — ikuti kebijakan unit.</Text>
            )}
          </View>
        </View>
        <View style={styles.headRight}>
          {r ? (
            <View style={styles.miniRead}>
              {/* the collapsed card is what gets scanned down the list, so the
                  slow-rate signal has to survive here too, not only when opened */}
              <Text style={[styles.miniNum, lajuTerlaluPelan(r.laju) && { color: C.warning }]}>
                {fmt(r.laju, 2)}{lajuTerlaluPelan(r.laju) ? ' ⚠' : ''}
              </Text>
              <Text style={styles.miniUnit}>mL/jam</Text>
            </View>
          ) : null}
          <Ionicons name={st.open ? 'chevron-up' : 'chevron-down'} size={22} color={C.ink3} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tick} onPress={() => onPatch({ on: !st.on })} activeOpacity={0.7}
        testID={`summary-toggle-${d.id}`}>
        <View style={[styles.checkbox, st.on && { backgroundColor: C.primary, borderColor: C.primary }]}>
          {st.on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
        <Text style={styles.tickTxt}>Masukkan ke lembar terapi</Text>
      </TouchableOpacity>

      {st.open && (
        <View style={styles.body}>
          <Text style={styles.lbl}>Sediaan dalam syringe</Text>
          <TouchableOpacity style={styles.select} onPress={() => setPresetOpen(true)} testID={`preset-${d.id}`}>
            <Text style={styles.selectTxt} numberOfLines={1}>{presetLabel}</Text>
            <Ionicons name="chevron-down" size={18} color={C.ink3} />
          </TouchableOpacity>

          <View style={styles.prep}>
            <TextInput style={[styles.prepInput, wb && styles.prepDisabled]} value={amtDisplay} editable={!wb}
              keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.ink3}
              onChangeText={(v) => onPatch({ amt: saring(v), preset: -1 })} testID={`amt-${d.id}`} />
            <Text style={styles.prepUnit}>{d.amtUnit} dalam</Text>
            <TextInput style={styles.prepInput} value={st.ml} keyboardType="decimal-pad" placeholder="0"
              placeholderTextColor={C.ink3} onChangeText={(v) => onPatch({ ml: saring(v) })} testID={`ml-${d.id}`} />
            <Text style={styles.prepUnit}>mL</Text>
          </View>
          <Text style={styles.conc}>{concText()}</Text>

          <Text style={[styles.lbl, { marginTop: 16 }]}>Dosis</Text>
          <View style={styles.dosebar}>
            <TextInput style={styles.doseInput} value={st.dose} keyboardType="decimal-pad" placeholder="0"
              placeholderTextColor={C.ink3} onChangeText={(v) => onPatch({ dose: saring(v) })}
              onBlur={() => { if (num(st.dose) > d.cap) onPatch({ dose: fmt(d.cap, D) }); }} testID={`dose-${d.id}`} />
            <Text style={styles.doseUnit}>{doseUnit(d)}</Text>
          </View>
          <Slider style={{ width: '100%', height: 36 }} minimumValue={0} maximumValue={d.cap} step={d.step}
            value={Math.min(isFinite(doseNum) ? doseNum : 0, d.cap)} minimumTrackTintColor={C.primary}
            maximumTrackTintColor={C.line} thumbTintColor={C.primary} onValueChange={(v) => onPatch({ dose: fmt(v, D) })} />
          <View style={styles.gauge}>
            <View style={[styles.gaugeBand, { left: `${bandL}%`, width: `${bandW}%`, backgroundColor: band }]} />
            <View style={[styles.gaugePin, { left: `${pinL}%` }]} />
          </View>
          <Text style={[styles.rangeNote, { color: NOTE_CLR[cls], fontFamily: cls === 'in' || cls === 'low' ? F.body : F.bodySemi }]}>
            {txt} · lazim {fmt(d.lo, D)}–{fmt(d.hi, D)} {doseUnit(d)}
          </Text>

          <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.readbox}>
            <Text style={styles.readout} testID={`read-${d.id}`}>{r ? fmt(r.laju, 2) : '––,––'}</Text>
            <Text style={styles.readunit}>mL / jam</Text>
          </LinearGradient>

          {r && lajuTerlaluPelan(r.laju) && (
            <View style={styles.slowBox} testID={`slow-${d.id}`}>
              <Ionicons name="alert-circle-outline" size={15} color={C.warning} />
              <Text style={styles.slowTxt}>
                Di bawah {fmt(LAJU_MIN, 1)} mL/jam syringe pump sulit menjaga akurasi. Pakai pengenceran yang lebih encer.
              </Text>
            </View>
          )}

          <Text style={styles.meta}>
            {d.noSetara ? '' : <>Setara <Text style={styles.metaB}>{r ? fmt(sv, sv < 0.01 ? 5 : sv < 1 ? 3 : 2) : '—'} {setaraUnit(d)}</Text>{'\n'}</>}
            Total <Text style={styles.metaB}>{r ? fmt(r.perJamAmt, 3) : '—'} {d.amtUnit}/jam</Text> · {r ? fmt(r.perJamAmt * 24, 2) : '—'} {d.amtUnit}/24 jam{'\n'}
            Syringe {rapi(st.ml) || '—'} mL habis dalam <Text style={styles.metaB}>{r && isFinite(r.habis) ? fmt(r.habis, 1) : '—'} jam</Text>
          </Text>

          <TouchableOpacity style={styles.summaryRow} onPress={() => setTableOpen(!tableOpen)}>
            <Text style={styles.summaryTxt}>Tabel titrasi</Text>
            <Ionicons name={tableOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.primary} />
          </TouchableOpacity>
          {tableOpen && (
            <View style={styles.table}>
              {d.tsteps && (
                <View style={styles.stepRow}>
                  <Text style={styles.stepLbl}>Naik tiap</Text>
                  {d.tsteps.map((v) => {
                    const on = (st.tstep ?? d.tstep) === v;
                    return (
                      <TouchableOpacity key={v} onPress={() => onPatch({ tstep: v })}
                        style={[styles.stepBtn, on && styles.stepBtnOn]} testID={`tstep-${d.id}-${v}`}>
                        <Text style={[styles.stepTxt, on && styles.stepTxtOn]}>{fmt(v, tdec(d))}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={styles.stepLbl}>{doseUnit(d)}</Text>
                </View>
              )}
              <View style={[styles.tr, styles.thead]}>
                <Text style={[styles.th, { flex: 1.4, textAlign: 'left' }]}>Dosis ({doseUnit(d)})</Text>
                <Text style={styles.th}>mL/jam</Text>
                <Text style={styles.th}>{d.amtUnit}/jam</Text>
              </View>
              {/* d.tblHi was ignored here while printHtml honoured it, so the printed
                  norepinefrin label ran to 0,5 while this table stopped at 0,3. */}
              {titrasiDoses(d, d.tblHi ?? d.hi, st.tstep).map((dose, i) => {
                const rr = hitungDose(d, st, bb, dose);
                return (
                  <View key={i} style={[styles.tr, dose > d.hi && styles.trHigh]}>
                    <Text style={[styles.td, { flex: 1.4, textAlign: 'left' }]}>{fmt(dose, tdec(d))}</Text>
                    <Text style={styles.td}>{rr ? fmt(rr.laju, 2) : '—'}</Text>
                    <Text style={styles.td}>{rr ? fmt(rr.perJamAmt, 3) : '—'}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.noteBox, { borderLeftColor: band }]}>
            <Text style={styles.noteTxt}>{d.note}</Text>
          </View>
        </View>
      )}

      <Modal visible={presetOpen} transparent animationType="fade" onRequestClose={() => setPresetOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPresetOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{d.nama} — pilih sediaan</Text>
            <ScrollView>
              {d.presets.map((p, i) => (
                <TouchableOpacity key={i} style={styles.opt} onPress={() => pickPreset(i)}>
                  <Text style={[styles.optTxt, st.preset === i && { color: C.primary, fontFamily: F.bodySemi }]}>{p.t}</Text>
                  {st.preset === i ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
                </TouchableOpacity>
              ))}

              {saved.length > 0 && <Text style={styles.savedHead}>Sediaan tersimpan unit</Text>}
              {saved.map((p, i) => (
                <View key={`s${i}`} style={styles.opt}>
                  <TouchableOpacity style={styles.savedPick} onPress={() => pickSaved(p)} testID={`saved-${d.id}-${i}`}>
                    <Ionicons name="bookmark" size={15} color={C.secondary} />
                    <Text style={styles.optTxt}>{rapi(p.amt)} {d.amtUnit} / {rapi(p.ml)} mL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteSaved && onDeleteSaved(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} testID={`saved-del-${d.id}-${i}`}>
                    <Ionicons name="trash-outline" size={18} color={C.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.opt} onPress={() => pickPreset(-1)}>
                <Text style={[styles.optTxt, st.preset === -1 && { color: C.primary, fontFamily: F.bodySemi }]}>Sediaan lain (isi sendiri)</Text>
                {st.preset === -1 ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnOff]} disabled={!canSave}
                onPress={() => onSaveCurrent && onSaveCurrent(num(st.amt), num(st.ml))} testID={`save-preset-${d.id}`}>
                <Ionicons name="add-circle-outline" size={18} color={canSave ? C.secondary : C.ink3} />
                <Text style={[styles.saveTxt, { color: canSave ? C.secondary : C.ink3 }]}>
                  Simpan sediaan saat ini{canSave ? ` (${rapi(st.amt)} ${d.amtUnit} / ${rapi(st.ml)} mL)` : ''}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line, borderRadius: 14, marginBottom: 14, paddingLeft: 18, paddingRight: 16, paddingVertical: 16, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)' }, default: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } } }) },
  cardRelax: { borderColor: C.danger },
  idle: { opacity: 0.65 },
  band: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  chead: { flexDirection: 'row', alignItems: 'flex-start' },
  h2: { fontFamily: F.head, fontSize: 20, color: C.ink, letterSpacing: -0.3 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6 },
  badgeTxt: { fontFamily: F.head, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.8 },
  isoLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  sw: { width: 22, height: 12, borderRadius: 3, borderWidth: 1 },
  isoTxt: { fontSize: 11, color: C.ink2, flex: 1 },
  isoB: { fontFamily: F.bodySemi, color: C.ink },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  miniRead: { alignItems: 'flex-end' },
  miniNum: { fontFamily: F.monoBold, fontSize: 17, color: C.primary },
  miniUnit: { fontFamily: F.body, fontSize: 9, color: C.ink3, letterSpacing: 0.5 },
  tick: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  tickTxt: { fontFamily: F.head6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: C.ink3 },
  body: { marginTop: 14 },
  lbl: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: C.ink3, marginBottom: 6 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  selectTxt: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink, marginRight: 8 },
  prep: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  prepInput: { width: 84, backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.line, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 8, fontFamily: F.mono, fontSize: 15, color: C.ink, textAlign: 'right' },
  prepDisabled: { color: C.ink3, backgroundColor: C.sunken },
  prepUnit: { fontFamily: F.body, fontSize: 12.5, color: C.ink2 },
  conc: { fontFamily: F.mono, fontSize: 11.5, color: C.ink3, marginTop: 10 },
  dosebar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doseInput: { width: 110, backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.line, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 8, fontFamily: F.monoBold, fontSize: 18, color: C.ink, textAlign: 'right' },
  doseUnit: { fontFamily: F.mono, fontSize: 12, color: C.ink2 },
  gauge: { height: 6, backgroundColor: C.sunken, borderRadius: 99, marginTop: 2, marginBottom: 8, position: 'relative' },
  gaugeBand: { position: 'absolute', top: 0, bottom: 0, borderRadius: 99, opacity: 0.4 },
  gaugePin: { position: 'absolute', top: -4, width: 3, height: 14, backgroundColor: C.ink, borderRadius: 2 },
  rangeNote: { fontSize: 11.5 },
  readbox: { marginTop: 14, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  readout: { fontFamily: F.monoBold, fontSize: 38, color: '#fff', letterSpacing: -1 },
  readunit: { fontFamily: F.head6, fontSize: 11, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: 1.4 },
  slowBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10, backgroundColor: C.warningLight, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: C.warning, padding: 10 },
  slowTxt: { flex: 1, fontFamily: F.bodyMed, fontSize: 11.5, color: C.warning, lineHeight: 16 },
  meta: { fontFamily: F.mono, fontSize: 11, color: C.ink3, lineHeight: 20, marginTop: 10 },
  metaB: { fontFamily: F.monoBold, color: C.ink },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: C.line2 },
  summaryTxt: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: C.primary },
  table: { marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' },
  stepLbl: { fontFamily: F.body, fontSize: 11.5, color: C.ink3 },
  stepBtn: { borderWidth: 1.5, borderColor: C.line, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 11 },
  stepBtnOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  stepTxt: { fontFamily: F.mono, fontSize: 12.5, color: C.ink2 },
  stepTxtOn: { fontFamily: F.monoBold, color: C.primary },
  tr: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.line2 },
  trHigh: { backgroundColor: C.warningLight },
  thead: { borderBottomWidth: 2, borderBottomColor: C.line },
  th: { flex: 1, fontFamily: F.head6, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.6, color: C.ink3, textAlign: 'right' },
  td: { flex: 1, fontFamily: F.mono, fontSize: 11.5, color: C.ink, textAlign: 'right' },
  noteBox: { marginTop: 12, backgroundColor: C.sunken, borderRadius: 8, borderLeftWidth: 4, padding: 12 },
  noteTxt: { fontFamily: F.body, fontSize: 12, color: C.ink2, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, maxHeight: '75%' },
  sheetTitle: { fontFamily: F.head, fontSize: 16, color: C.ink, marginBottom: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line2, gap: 10 },
  optTxt: { fontFamily: F.body, fontSize: 14, color: C.ink, flex: 1, marginRight: 8 },
  savedPick: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  savedHead: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: C.secondary, marginTop: 14, marginBottom: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: C.secondaryLight, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 14 },
  saveBtnOff: { backgroundColor: C.sunken },
  saveTxt: { fontFamily: F.head6, fontSize: 12, letterSpacing: 0.3 },
});
