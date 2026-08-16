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
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
