# PediDrip — Install on a phone

PediDrip is an Expo (React Native) app. It runs fully offline once installed —
all calculations are local and the fonts are bundled.

## Option A — Quick try with Expo Go (no build)
1. Install **Expo Go** from the App Store / Play Store on the phone.
2. On a computer in this project folder run:
   ```
   cd frontend
   npx expo start
   ```
3. Scan the QR code with the phone (same Wi‑Fi). PediDrip opens in Expo Go.
   > Note: Expo Go needs a network to load the JS the first time; a real installed
   > build (Option B) is what runs offline at the bedside.

## Option B — Install a standalone app with EAS Build (recommended)
This produces a real installable app (`.apk` for Android, `.ipa`/TestFlight for iOS).

1. Create a free Expo account at https://expo.dev and log in:
   ```
   cd frontend
   npx eas login
   ```
2. First time only, link the project:
   ```
   npx eas init
   ```
3. Build:
   - **Android APK (sideload / internal):**
     ```
     npx eas build -p android --profile preview
     ```
     When it finishes, open the link, download the `.apk` and install it on the phone
     (enable "install unknown apps"). Great for distributing to a ward internally.
   - **iOS (internal / TestFlight):** requires an Apple Developer account.
     ```
     npx eas build -p ios --profile preview
     ```

4. For store submission later, build with `--profile production` and use `npx eas submit`.

## App identifiers (already configured in `app.json`)
- Name: **PediDrip**
- Android package / iOS bundle id: `com.pedidrip.app`
- Icon, adaptive icon and splash are set under `assets/`.

## Offline behaviour
- Native builds (Option B) run with **no signal** — logic and fonts are on-device.
- The web preview also needs no CDN (fonts are served locally from `public/fonts`).
