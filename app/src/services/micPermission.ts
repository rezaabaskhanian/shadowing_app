import { PermissionsAndroid, Platform } from 'react-native';

/**
 * مجوز میکروفن را (روی اندروید) قبل از شروع ضبط می‌گیرد. `react-native-nitro-sound`
 * خودش مجوز سطح سیستم را نمی‌گیرد؛ اگر این را نپرسیم `startRecorder` رد می‌شود.
 */
export const ensureMicPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (already) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};
