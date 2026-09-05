import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold } from '@expo-google-fonts/public-sans';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

import './src/webfonts';
import { F, useTheme, ThemeProvider } from './src/theme';
import { DRUGS, GRUP, TABEL, defaultPreset } from './src/data/drugs';
import { rapi, fmt, dec, saring, num } from './src/logic/calc';
import DrugCard from './src/components/DrugCard';
import SummarySheet from './src/components/SummarySheet';
import { printTherapy } from './src/print';

const SAVED_KEY = 'pedidrip_saved_presets_v1';

const makeInitial = () => {
  const s = {};
  DRUGS.forEach((d) => {
    // presets are ordered dilute -> concentrated, so the one to open with is the
    // marked default, not index 0
    const i = defaultPreset(d), p = d.presets[i];
    s[d.id] = {
      preset: i, amt: rapi(p.amt ?? 0), ml: rapi(p.ml), dose: fmt(d.start, dec(d)),
      on: false, open: false,
    };
  });
  return s;
};

const confirmReset = (onYes) => {
  if (Platform.OS === 'web') { if (window.confirm('Kosongkan semua isian untuk pasien baru?')) onYes(); return; }
  Alert.alert('Pasien baru', 'Kosongkan semua isian untuk pasien baru?', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Kosongkan', style: 'destructive', onPress: onYes },
  ]);
};

function Home() {
  const { C, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [bb, setBb] = useState('');
  const [pn, setPn] = useState('');
  const [prm, setPrm] = useState('');
  const [ptl, setPtl] = useState('');
  const [pt, setPt] = useState('');
  const [ptOpen, setPtOpen] = useState(false);
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [states, setStates] = useState(makeInitial);
  const [saved, setSaved] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((v) => { if (v) { try { setSaved(JSON.parse(v)); } catch (e) {} } });
  }, []);
  const persistSaved = (next) => { setSaved(next); AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {}); };
  const addSaved = (id, amt, ml) => {
    const list = saved[id] || [];
    if (list.some((p) => p.amt === amt && p.ml === ml)) return;
    persistSaved({ ...saved, [id]: [...list, { amt, ml }] });
  };
  const deleteSaved = (id, i) => {
    const list = (saved[id] || []).filter((_, idx) => idx !== i);
    persistSaved({ ...saved, [id]: list });
  };

  const patch = useCallback((id, p) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  const checkedCount = DRUGS.filter((d) => states[d.id].on).length;
  const bbNum = num(bb);
  const visible = (d) => !onlyChecked || states[d.id].on;

  const reset = () => confirmReset(() => {
    setStates(makeInitial());
    setBb(''); setPn(''); setPrm(''); setPtl(''); setPt('');
    setOnlyChecked(false);
  });

  const onPrint = async () => {
    try { await printTherapy(states, bb, { pn, prm, ptl, pt }); }
    catch (e) { if (Platform.OS !== 'web') Alert.alert('Gagal mencetak', String(e?.message || e)); }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 22 }]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.brand}>PediDrip</Text>
              <Text style={styles.tagline}>Kalkulator Infus Pediatrik · PICU</Text>
            </View>
            <TouchableOpacity style={styles.themeBtn} onPress={toggle} testID="theme-toggle" accessibilityLabel="Ganti mode terang/gelap">
              <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={19} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.wrap}>
          {/* Weight card */}
          <View style={styles.wcard}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.wlabel}>Berat badan</Text>
              <View style={styles.wrow}>
                <TextInput
                  style={styles.winput}
                  value={bb}
                  keyboardType="decimal-pad"
                  placeholder="0,0"
                  placeholderTextColor={C.ink3}
                  onChangeText={(v) => setBb(saring(v))}
                  // rapi() normalises without rounding (3,25 kg stays 3,25 kg).
                  // fmt(bbNum,1) used to round every weight to one decimal, which
                  // shifted a 0,85 kg neonate's dose by ~6%.
                  onBlur={() => setBb(bbNum > 0 ? rapi(bbNum) : '')}
                  testID="weight-input"
                />
                <Text style={styles.wkg}>kg</Text>
              </View>
            </View>
            <View style={styles.wbtns}>
              <TouchableOpacity style={styles.iconBtn} onPress={onPrint} testID="print-btn">
                <Ionicons name="print-outline" size={18} color={C.primary} />
                <Text style={styles.iconBtnTxt}>Cetak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={reset} testID="reset-btn">
                <Ionicons name="refresh-outline" size={18} color={C.danger} />
                <Text style={[styles.iconBtnTxt, { color: C.danger }]}>Baru</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!bbNum && (
            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={18} color={C.primary} />
              <Text style={styles.hintTxt}>Isi berat badan untuk mengaktifkan perhitungan. Atur sediaan & dosis tiap obat, lalu tandai untuk masuk lembar terapi.</Text>
            </View>
          )}

          {/* Patient info */}
          <TouchableOpacity style={styles.patHead} onPress={() => setPtOpen(!ptOpen)} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={16} color={C.ink2} />
            <Text style={styles.patHeadTxt}>Identitas pasien {pn ? `· ${pn}` : ''}</Text>
            <Ionicons name={ptOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.ink3} />
          </TouchableOpacity>
          {ptOpen && (
            <View style={styles.patBody}>
              {[
                ['Nama pasien', pn, setPn],
                ['No. rekam medis', prm, setPrm],
                ['Tanggal lahir', ptl, setPtl],
                ['Tanggal / jam', pt, setPt],
              ].map(([lbl, val, set]) => (
                <View key={lbl} style={styles.patField}>
                  <Text style={styles.patLbl}>{lbl}</Text>
                  <TextInput style={styles.patInput} value={val} onChangeText={set} placeholderTextColor={C.ink3} />
                </View>
              ))}
              <Text style={styles.patNote}>Data pasien hanya ada di memori aplikasi selama layar terbuka — tidak disimpan & tidak dikirim ke mana pun.</Text>
            </View>
          )}

          {/* Filter */}
          <TouchableOpacity
            style={[styles.filter, onlyChecked && styles.filterOn]}
            onPress={() => setOnlyChecked(!onlyChecked)}
            disabled={!onlyChecked && checkedCount === 0}
            testID="filter-btn"
          >
            <Ionicons name={onlyChecked ? 'list' : 'funnel-outline'} size={15} color={onlyChecked ? '#fff' : C.primary} />
            <Text style={[styles.filterTxt, onlyChecked && { color: '#fff' }]}>
              {onlyChecked ? 'Tampilkan semua obat' : `Hanya yang dicentang (${checkedCount})`}
            </Text>
          </TouchableOpacity>

          {/* Groups */}
          {GRUP.map((g) => {
            const list = DRUGS.filter((d) => d.grup === g.id && visible(d));
            if (!list.length) return null;
            return (
              <View key={g.id}>
                <Text style={styles.gjudul}>{g.judul}</Text>
                {list.map((d) => (
                  <DrugCard
                    key={d.id}
                    d={d}
                    st={states[d.id]}
                    bb={bb}
                    onPatch={(p) => patch(d.id, p)}
                    saved={saved[d.id] || []}
                    onSaveCurrent={(amt, ml) => addSaved(d.id, amt, ml)}
                    onDeleteSaved={(i) => deleteSaved(d.id, i)}
                  />
                ))}
              </View>
            );
          })}

          {/* Summary */}
          <SummarySheet states={states} bb={bb} />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.fTxt}><Text style={styles.fB}>Alat bantu hitung, bukan pengganti verifikasi.</Text> Rentang dosis adalah rentang lazim pediatrik untuk infus kontinu dan bisa berbeda dari protokol unit. Cocokkan dengan instruksi DPJP dan lakukan double check 2 perawat sebelum obat diberikan.</Text>
            <View style={styles.relaxWarn}>
              <Text style={styles.relaxTxt}>Vekuronium & rokuronium melumpuhkan otot tanpa sedasi maupun analgesia. Pastikan sedasi & analgesia adekuat dan pasien terventilasi mekanik sebelum relaksan dijalankan.</Text>
            </View>
            <Text style={styles.tabelVersi}>
              Tabel dosis v{TABEL.versi} · ditinjau {TABEL.ditinjau}
            </Text>
            <Text style={styles.credit}>CREATED BY THE URBAN MAMA · 2026</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function App() {
  const isWeb = Platform.OS === 'web';
  const [nativeLoaded] = useFonts(isWeb ? {} : {
    Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold,
    PublicSans_400Regular, PublicSans_500Medium, PublicSans_600SemiBold,
    JetBrainsMono_500Medium, JetBrainsMono_700Bold,
  });
  if (!isWeb && !nativeLoaded) return <View style={{ flex: 1, backgroundColor: '#2563EB' }} />;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  hero: { paddingHorizontal: 20, paddingBottom: 40, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: F.display, fontSize: 38, color: '#fff', letterSpacing: -1.6 },
  tagline: { fontFamily: F.head6, fontSize: 11, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 4 },
  themeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.18)' },
  wrap: { paddingHorizontal: 16, marginTop: -24 },
  wcard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: C.line,
    ...Platform.select({ web: { boxShadow: '0 10px 15px -3px rgba(0,0,0,.1)' }, default: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } } }) },
  wlabel: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, color: C.ink3 },
  wrow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  // flexShrink lets a 3-digit weight give ground instead of shoving "kg" under
  // the Cetak/Baru buttons; minWidth:0 is what actually allows the shrink.
  winput: { flex: 1, minWidth: 0, fontFamily: F.monoBold, fontSize: 40, color: C.ink, padding: 0 },
  wkg: { fontFamily: F.head6, fontSize: 18, color: C.ink3, flexShrink: 0 },
  wbtns: { gap: 8, flexShrink: 0, marginLeft: 12 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.line, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, justifyContent: 'center' },
  iconBtnDanger: { borderColor: C.dangerLight },
  iconBtnTxt: { fontFamily: F.head6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: C.primary },
  hint: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, marginTop: 14 },
  hintTxt: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink2, lineHeight: 19 },
  patHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.line },
  patHeadTxt: { flex: 1, fontFamily: F.bodySemi, fontSize: 13, color: C.ink2 },
  patBody: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, borderTopWidth: 0, marginTop: -6, padding: 16, paddingTop: 10, gap: 12 },
  patField: { gap: 4 },
  patLbl: { fontFamily: F.head6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: C.ink3 },
  patInput: { borderBottomWidth: 1.5, borderBottomColor: C.line, fontFamily: F.body, fontSize: 15, color: C.ink, paddingVertical: 6 },
  patNote: { fontFamily: F.body, fontSize: 11, color: C.ink3, lineHeight: 16, marginTop: 2 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 18, borderWidth: 1.5, borderColor: C.primary, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14 },
  filterOn: { backgroundColor: C.primary },
  filterTxt: { fontFamily: F.head6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: C.primary },
  gjudul: { fontFamily: F.head, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.6, color: C.ink2, marginTop: 28, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 3, borderBottomColor: C.primary },
  footer: { marginTop: 28, borderTopWidth: 1.5, borderTopColor: C.line, paddingTop: 18 },
  fTxt: { fontFamily: F.body, fontSize: 12, color: C.ink2, lineHeight: 18 },
  fB: { fontFamily: F.bodySemi, color: C.ink },
  relaxWarn: { marginTop: 14, backgroundColor: C.dangerLight, borderLeftWidth: 4, borderLeftColor: C.danger, borderRadius: 8, padding: 12 },
  relaxTxt: { fontFamily: F.bodyMed, fontSize: 12, color: C.danger, lineHeight: 18 },
  tabelVersi: { fontFamily: F.mono, fontSize: 11, color: C.ink3, textAlign: 'center', marginTop: 16 },
  credit: { fontFamily: F.head6, fontSize: 10, letterSpacing: 1.2, color: C.ink3, textAlign: 'center', marginTop: 8, textTransform: 'uppercase' },
});
