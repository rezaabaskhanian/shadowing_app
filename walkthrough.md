# ShadowTalk UI Redesign & Enhancement Summary

This document summarizes the complete UI redesign, bilingual i18n implementation, player enhancements, and authentication refactoring applied to the **ShadowTalk** application.

---

## 🎨 1. Dark Minimal Design System & Theme Updates (`colors.ts`)

- **Primary CTA Color**: Changed to Amber / Warm Orange (`#FFA01C`).
- **Secondary Accent**: Changed to Teal / Cyan (`#14B8A6`).
- **Backgrounds**: Obsidian dark (`#0C1017`, `#151C28`, `#1F2939`).
- **Borders & Cards**: Rounded sleek borders (`#202A3B`, `borderRadius: 24`).

```typescript
export const COLORS = {
  background: '#0C1017',
  surface: '#151C28',
  surfaceLight: '#1F2939',
  primary: '#FFA01C',   // Amber CTA
  secondary: '#14B8A6', // Teal Accent
  teal: '#14B8A6',
  amber: '#FFA01C',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#202A3B',
};
```

---

## 🏠 2. Minimal Home Screen (`Home.tsx` & `ScenarioCard.tsx`)

- **Header Section**: Clean greeting (`Good evening, Maya`), streak badge (`🔥 14`), and language selector toggle (`EN / FA`).
- **Daily Reps Card**: `Today's shadowing` stats (`38 / 60 reps`), teal progress bar, duration (`11 min`), and `Fluency 72%`.
- **Continue Story Hero**: Rounded card with cover image, category badge `SUPERMARKET · CHAPTER 2`, title `The Last Can of Tuna`, yellow progress line, and floating amber play button (`▶`).
- **Worlds List**: Minimal cards showing level tags (`A2`, `A1`, `B1`, `B2`), sentence counts, durations, and completion checkmarks (`Check`).
- **3-Tab Minimal Navigation**: `Stories`, `Progress`, `You`.

---

## 🎧 3. Scene Intro & Practice Player (`SceneScreen.tsx` & `AudioPlayer.tsx`)

- **Scene Overview Screen (Intro)**:
  - Hero image with top-right `X` close button.
  - Category pill: `SUPERMARKET · LEVEL A2`.
  - Title & description text.
  - 3 metric pills: `5 Hotspots`, `24 Sentences`, `12 Minutes`.
  - "CONVERSATIONS IN THIS SCENE" numbered list (Checkout, Dairy fridge, Fruit stand, Drinks cooler, Shopping basket).
  - Teal rule banner: `✨ Every line is practised 7 times across Listen -> Shadow -> Compare -> Free Shadow.`
  - Amber CTA button: `▶ Enter the scene`.

- **Active Practice Player Sheet**:
  - Fullscreen scene image with interactive mic hotspot pin (`🎙`).
  - Player bottom sheet:
    - 5 amber step progress segments.
    - Speaker badge (`CU CUSTOMER`), main English sentence, and Persian translation.
    - Amber audio waveform visualizer.
    - Control bar: `1x` (speed toggle `0.75x`, `1x`, `1.25x`, `1.5x`), `⏮` skip prev, `↺` replay, `▶` big amber play button, `⏭` skip next, teal `Auto` toggle button.
    - Bottom Action Pill: `🎙 Shadow this line   0/7`.

---

## 🌐 4. Bilingual Support (English + Persian `i18n.tsx`)

- Built an `i18n.tsx` module with `LanguageProvider` and `useLanguage()` hook.
- All UI strings set to **English by default** with instant toggle to Persian (`FA`) and support for Persian sentence translations.

---

## 🔐 5. Password & SMS OTP Authentication (`AuthScreens.tsx`)

- **Social Logins Removed**: Google and Apple login buttons completely removed.
- **Login Options**:
  1. Email / Phone + Password login.
  2. **SMS OTP Registration & Verification**:
     - Phone Number input (`0912...`).
     - Send SMS code button (`Send SMS Code`).
     - 4-Digit OTP verification boxes.
     - Verify and sign in (`Verify & Sign In`).

---

## 📁 File Change List

1. `app/src/theme/colors.ts`: Minimal dark design tokens.
2. `app/src/data/i18n.tsx`: Bilingual translation manager and context.
3. `app/src/navigation/AppNavigator.tsx`: Clean 3-tab navigation bar.
4. `app/src/components/ScenarioCard.tsx`: Minimal list card matching Screenshot #1.
5. `app/src/screens/Home.tsx`: Home screen UI redesign matching Screenshots #1 & #3.
6. `app/src/screens/SceneScreen.tsx`: Scene intro overview (Screenshot #2) and practice player sheet (Screenshot #4).
7. `app/src/components/AudioPlayer.tsx`: Playback speed control & web audio engine updates.
8. `app/src/screens/AuthScreens.tsx`: Password login & SMS OTP flow.
9. `app/src/screens/Placeholders.tsx`: Progress & Profile screens with dark theme and i18n language toggle.
10. `app/App.tsx`: App root wrapped with `LanguageProvider`.
