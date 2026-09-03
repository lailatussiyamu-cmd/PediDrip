import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { DRUGS } from '../data/drugs';
import { fmt, rapi, konsen, dec, doseUnit, hitung, num } from '../logic/calc';

export default function SummarySheet({ states, bb }) {
  const aktif = DRUGS.filter((d) => states[d.id]?.on);
  const w = num(bb);
  let total = 0;

  return (
    <View style={styles.sum}>
      <Text style={styles.title}>Lembar terapi infus kontinu</Text>
      <Text style={styles.sub}>
        {aktif.length
          ? `Berat badan ${w > 0 ? fmt(w, 1) : '—'} kg · ${aktif.length} obat`
          : 'Belum ada obat yang dicentang.'}
      </Text>

      {aktif.length === 0 ? (
        <Text style={styles.empty}>Aktifkan “Masukkan ke lembar terapi” pada kartu obat untuk menampilkannya di sini.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, styles.cName]}>Obat</Text>
              <Text style={[styles.th, styles.cPrep]}>Sediaan</Text>
              <Text style={[styles.th, styles.cConc]}>Konsentrasi</Text>
              <Text style={[styles.th, styles.cDose]}>Dosis</Text>
              <Text style={[styles.th, styles.cRate]}>Laju pump</Text>
            </View>
            {aktif.map((d) => {
              const st = states[d.id];
              const r = hitung(d, st, bb);
              if (r) total += r.laju;
              return (
                <View key={d.id} style={styles.tr}>
                  <Text style={[styles.tdName, styles.cName]}>{d.nama}</Text>
                  <Text style={[styles.td, styles.cPrep]}>{rapi(st.amt) || '—'} {d.amtUnit} / {rapi(st.ml) || '—'} mL</Text>
                  <Text style={[styles.td, styles.cConc]}>{r ? konsen(r.conc) : '—'} {d.amtUnit}/mL</Text>
                  <Text style={[styles.td, styles.cDose]}>{isFinite(num(st.dose)) ? fmt(num(st.dose), dec(d)) : '—'} {doseUnit(d)}</Text>
                  <Text style={[styles.tdRate, styles.cRate]}>{r ? fmt(r.laju, 2) : '—'} mL/jam</Text>
                </View>
              );
            })}
            <View style={[styles.tr, styles.tfoot]}>
              <Text style={[styles.tdName, { width: styles.cName.width + styles.cPrep.width + styles.cConc.width + styles.cDose.width }]}>Total cairan dari infus kontinu</Text>
              <Text style={[styles.tdRate, styles.cRate]}>{fmt(total, 2)} mL/jam</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.sign}>
        {['Disiapkan oleh', 'Diperiksa ulang oleh', 'DPJP'].map((s) => (
          <View key={s} style={styles.signCol}><Text style={styles.signTxt}>{s}</Text></View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sum: { backgroundColor: C.surface, borderWidth: 2.5, borderColor: C.primary, borderRadius: 14, padding: 20, marginTop: 8 },
  title: { fontFamily: F.head, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, color: C.ink },
  sub: { fontFamily: F.body, fontSize: 12, color: C.ink3, marginTop: 4, marginBottom: 14 },
  empty: { fontFamily: F.body, fontSize: 13, color: C.ink3, lineHeight: 19 },
  tr: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  thead: { borderBottomWidth: 2, borderBottomColor: C.line },
  tfoot: { borderBottomWidth: 0, borderTopWidth: 3, borderTopColor: C.primary },
  th: { fontFamily: F.head6, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.6, color: C.ink3 },
  td: { fontFamily: F.mono, fontSize: 11.5, color: C.ink },
  tdName: { fontFamily: F.bodySemi, fontSize: 12.5, color: C.ink },
  tdRate: { fontFamily: F.monoBold, fontSize: 11.5, color: C.primary },
  cName: { width: 130 },
  cPrep: { width: 150 },
  cConc: { width: 120 },
  cDose: { width: 130 },
  cRate: { width: 100 },
  sign: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 24 },
  signCol: { flex: 1, minWidth: 120, borderTopWidth: 2, borderTopColor: C.line, paddingTop: 8 },
  signTxt: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: C.ink3 },
});
