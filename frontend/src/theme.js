import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Palettes (light ported from PediDrip web; dark from its prefers-color-scheme block) ----
export const lightC = {
  primary: '#2563EB', primaryDark: '#1D4ED8', primaryLight: '#DBEAFE',
  secondary: '#7C3AED', secondaryLight: '#EDE9FE',
  accent: '#0EA5E9', success: '#059669', successLight: '#D1FAE5',
  warning: '#B45309', warningLight: '#FEF3C7',
  danger: '#DC2626', dangerLight: '#FEE2E2',
  pink: '#DB2777', pinkLight: '#FCE7F3',
  paper: '#F8FAFC', surface: '#FFFFFF', sunken: '#F1F5F9',
  line: '#E2E8F0', line2: '#F1F5F9',
  ink: '#0F172A', ink2: '#475569', ink3: '#94A3B8',
  white: '#FFFFFF',
  grad: ['#2563EB', '#7C3AED'],
};

export const darkC = {
  primary: '#3B82F6', primaryDark: '#2563EB', primaryLight: '#1E3A5F',
  secondary: '#8B5CF6', secondaryLight: '#2D1B4E',
  accent: '#38BDF8', success: '#10B981', successLight: '#064E3B',
  warning: '#F59E0B', warningLight: '#78350F',
  danger: '#EF4444', dangerLight: '#7F1D1D',
  pink: '#EC4899', pinkLight: '#831843',
  paper: '#0F172A', surface: '#1E293B', sunken: '#172033',
  line: '#334155', line2: '#1E293B',
  ink: '#F8FAFC', ink2: '#94A3B8', ink3: '#64748B',
  white: '#FFFFFF',
  grad: ['#3B82F6', '#8B5CF6'],
};

// Kept for any static imports; represents the light palette by default.
export const C = lightC;

// Font families (loaded via @expo-google-fonts / web @font-face)
export const F = {
  display: 'Archivo_800ExtraBold',
  head: 'Archivo_700Bold',
  head6: 'Archivo_600SemiBold',
  body: 'PublicSans_400Regular',
  bodyMed: 'PublicSans_500Medium',
  bodySemi: 'PublicSans_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

// Badge (class chip) colors keyed by drug.badge — themed
export const makeBadge = (c) => ({
  benzo: { bg: c.primaryLight, fg: c.primary },
  opioid: { bg: c.pinkLight, fg: c.pink },
  induksi: { bg: c.primaryLight, fg: c.accent },
  alpha: { bg: c.successLight, fg: c.success },
  vaso: { bg: c.secondaryLight, fg: c.secondary },
  diur: { bg: c.sunken, fg: c.ink2 },
  relax: { bg: c.dangerLight, fg: c.danger },
  horm: { bg: c.sunken, fg: c.ink2 },
  resp: { bg: c.sunken, fg: c.ink2 },
});

const bandVar = (c) => ({
  'var(--benzo)': c.primary,
  'var(--opioid)': c.pink,
  'var(--induksi)': c.accent,
  'var(--alpha)': c.success,
  'var(--vaso)': c.secondary,
  'var(--diur)': c.ink2,
  'var(--relax)': c.danger,
});
export const bandColor = (d, c) => bandVar(c)[d.band] || c.ink2;

// ---- Theme context / provider ----
const THEME_KEY = 'pedidrip_theme_v1';
const ThemeContext = createContext({ C: lightC, mode: 'light', toggle: () => {}, setMode: () => {} });

export function ThemeProvider({ children }) {
  const sys = useColorScheme();
  const [stored, setStored] = useState(undefined); // undefined=loading, null=follow system, 'light'/'dark'=override

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => setStored(v === 'dark' || v === 'light' ? v : null)).catch(() => setStored(null));
  }, []);

  const setMode = (m) => { setStored(m); AsyncStorage.setItem(THEME_KEY, m).catch(() => {}); };
  const active = (stored ?? sys) === 'dark' ? 'dark' : 'light';
  const palette = active === 'dark' ? darkC : lightC;

  const value = useMemo(
    () => ({ C: palette, mode: active, toggle: () => setMode(active === 'dark' ? 'light' : 'dark'), setMode }),
    [active]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
