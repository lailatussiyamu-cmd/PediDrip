# PediDrip Mobile — PRD

## Original problem statement
Build a native mobile app based on the user's existing web clinical tool (PediDrip,
https://github.com/lailatussiyamu-cmd/PediDrip). Users: doctors/clinicians. No login.

## What PediDrip is
A pediatric PICU continuous-infusion **syringe-pump rate calculator** (Bahasa Indonesia).
Given a patient weight, a syringe preparation (amount in mg/mcg/unit per mL) and a dose
(mcg/kg/min, mcg/kg/hr, or unit/kg/hr), it computes the pump rate in mL/hr, a titration
table, ISO 26825 syringe colour code, and a printable therapy sheet + syringe titration
label cards. Fully client-side; no patient data is stored.

## Architecture
- **Native app via Expo (SDK 57, React Native 0.86, React 19)** in `/app/frontend`.
  Same codebase previews on **web (port 3000)** and installs natively on iOS/Android.
- Fully client-side calculation — no backend calls. A minimal FastAPI health server lives
  in `/app/backend` only to keep supervisor healthy.
- Web fonts (Archivo / Public Sans / JetBrains Mono) injected via `@font-face` in
  `src/webfonts.js` (expo-font's web loader rendered blank glyphs under Metro web);
  native uses `@expo-google-fonts` via `useFonts`.

## Key files
- `frontend/App.js` — main screen (hero, weight, patient info, filter, grouped cards, summary, footer)
- `frontend/src/data/drugs.js` — 18 drugs, ISO colour map, groups (ported verbatim from index.html)
- `frontend/src/logic/calc.js` — all formatting + `hitung`/`status`/`titrasiDoses` (ported)
- `frontend/src/components/DrugCard.js` — per-drug card: preset picker, amount/mL, dose slider+input, readout, titration table
- `frontend/src/components/SummarySheet.js` — continuous-infusion therapy sheet
- `frontend/src/print.js` — builds HTML therapy sheet + ISO titration label cards, prints via expo-print
- `frontend/src/webfonts.js` — web `@font-face` injection

## Implemented (2026-06)
- Full port of the PediDrip calculator to a native/Expo app with the original blue→purple clinical theme.
- Weight-driven live pump-rate calc for all 18 drugs, presets (incl. weight-based Rule-of-6/0.6), dose slider + manual entry, range status, titration tables.
- Expandable drug cards grouped (sedasi/analgesia/relaksan, vasoaktif/inotropik, diuretik & lainnya).
- "Masukkan ke lembar terapi" checkbox → live therapy summary sheet with total fluid rate.
- Filter (only-checked), patient identity (not persisted), "Pasien baru" reset, and Cetak (print/PDF therapy sheet + syringe titration label cards with ISO colours).
- Offline-ready: all math client-side; fonts bundled locally (native via @expo-google-fonts, web via /public/fonts @font-face — no CDN). Custom app icon, Android adaptive icon, splash screen.
- **Device install**: `eas.json` (development/preview/production profiles) + `frontend/INSTALL.md` guide (Expo Go quick-try + EAS APK/iOS build). Bundle id `com.pedidrip.app`.
- **Unit presets**: save/recall/delete favourite syringe preparations per drug, persisted offline via AsyncStorage key `pedidrip_saved_presets_v1`.
- **Bolus/loading-dose helper**: per-drug bolus section (11 drugs in `src/data/bolus.js`) computing total dose + mL to push from the current concentration, with usual-range hints and DPJP-verify disclaimer.

All verified by testing agent — iteration_1: 12/12 after fix; iteration_2 (new features + regression): 100%.

## Notes / limitations
- Print (2026-06): print output = titration cards only, PORTRAIT labels 72×88mm, 2 per row × 3 rows = 6 per A4 page, with dashed cut frames + crop marks + bolus line; ISO colours. On web, `Cetak` opens a new window (expo-print web ignores html, so `src/print.js` renders our own doc); native → PDF. Builder in `src/printHtml.js`.
- Deployment (2026-06): fixed prod deploy — created `backend/.env` (MONGO_URL, DB_NAME) and `frontend/.env` (Expo tunnel vars); start script → `expo start --tunnel --port 3000`. deployment_agent status: PASS.
- Dark mode: themeable palette in `src/theme.js` (ThemeProvider/useTheme, light + dark from the original web app), toggle in the hero (top-right, testID `theme-toggle`), persisted via AsyncStorage key `pedidrip_theme_v1`, follows device `prefers-color-scheme` by default. Verified 100% (light #F8FAFC ↔ dark #0F172A) with no regressions.
- EAS cloud build must be run by the user (needs their free Expo account): see `frontend/INSTALL.md`. Config is ready.
- Stripe payments (Emergent claimable sandbox): requested by user but PAUSED pending answers on what is sold / price / placement.

## Backlog / Next
- P1: Offline install polish (app icons/splash), EAS build config for real device installs.
- P2: Save/recall favourite preparations per unit; dark mode; loading-dose helper.
- P2: bolus/loading dose calculators (currently out of scope, given separately).
