import { StyleSheet } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/**
 * استایل «کارت پیام» که بین چند کامپوننت مشترک است: بازخورد نمره‌دهی
 * (`PronunciationFeedback`) و هشدار «ضبط ممکن نیست» در پنل اصلی. یک‌جا نگه
 * داشته می‌شود تا این دو ظاهر یکسانی نگه دارند بدون کپی-پیست.
 */
export const feedbackCardStyles = StyleSheet.create({
  feedbackCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    elevation: 2,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  feedbackCardError: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.25)',
  },
  feedbackHint: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  feedbackErrorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    textAlign: 'center',
  },
});
