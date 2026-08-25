export const COLORS = {
  // Soft-white surface tokens (light theme)
  background: '#f9f9ff',
  backgroundSoft: '#f0f3ff',
  surface: '#ffffff',
  surfaceLight: '#e7eefe',
  surfaceCard: '#ffffff',
  surfaceHigh: '#e2e8f8',
  surfaceHighest: '#dce2f3',

  // Brand & Accent Colors
  primary: '#3525cd', // Indigo — CTAs, active states, focus
  primaryDark: '#2a1ea3',
  primaryContainer: '#4f46e5',
  primaryLight: 'rgba(53, 37, 205, 0.10)',
  onPrimaryContainer: '#dad7ff',

  secondary: '#fea619', // Gold — reserved for streaks/achievements only
  secondaryContainer: '#684000',
  secondaryLight: 'rgba(254, 166, 25, 0.15)',

  tertiary: '#006e4b', // Green — success / positive actions
  tertiaryLight: 'rgba(0, 110, 75, 0.12)',
  onTertiaryContainer: '#67f4b7',

  // Deprecated aliases — kept only so not-yet-migrated screens
  // (Scenes/Progress/Leitner/SceneScreen, ScenarioCard, LeitnerBoxModal,
  // WordsSheet) keep rendering sensibly until their redesign phase.
  // Remove each alias as its screen is migrated.
  accent: '#006e4b',
  teal: '#006e4b',
  amber: '#3525cd',
  cyan: '#006e4b',
  orange: '#3525cd',
  pink: '#F43F5E',

  // Neutral Text Tokens
  text: '#151c27',
  textSecondary: '#464555',
  muted: '#777587',
  border: '#c7c4d8',
  borderLight: '#e2e8f8',

  // State Colors
  success: '#006e4b',
  error: '#ba1a1a',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
};

/** رنگ هگز دلخواه (مثلاً از تنظیمات کاربر) را به rgba با شفافیت داده‌شده تبدیل می‌کند. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

export const BORDER_RADIUS = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  full: 9999,
};
