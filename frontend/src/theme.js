// Palette & typography ported from the PediDrip web app (light clinical theme).
export const C = {
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
};

export const GRAD = ['#2563EB', '#7C3AED'];

// Font families (loaded via @expo-google-fonts)
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

// Badge (class chip) colors keyed by drug.badge
export const BADGE = {
  benzo: { bg: C.primaryLight, fg: C.primary },
  opioid: { bg: C.pinkLight, fg: C.pink },
  induksi: { bg: C.primaryLight, fg: C.accent },
  alpha: { bg: C.successLight, fg: C.success },
  vaso: { bg: C.secondaryLight, fg: C.secondary },
  diur: { bg: C.sunken, fg: C.ink2 },
  relax: { bg: C.dangerLight, fg: C.danger },
  horm: { bg: C.sunken, fg: C.ink2 },
  resp: { bg: C.sunken, fg: C.ink2 },
};

// Left accent band color, resolving the CSS var strings kept in drug data.
export const BANDVAR = {
  'var(--benzo)': C.primary,
  'var(--opioid)': C.pink,
  'var(--induksi)': C.accent,
  'var(--alpha)': C.success,
  'var(--vaso)': C.secondary,
  'var(--diur)': C.ink2,
  'var(--relax)': C.danger,
};

export const bandColor = (d) => BANDVAR[d.band] || C.ink2;
