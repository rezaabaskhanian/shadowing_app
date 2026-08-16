import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Save } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { feedbackCardStyles } from './sharedStyles';

/**
 * ردیف زیر کارت ویوفرمِ مرحله‌ی ضبط: هشدارِ «ضبط ممکن نیست» (اگر پیش بیاید)،
 * راهنمای «نگه دار و بگو»، و وضعیت ذخیره‌ی آخرین ضبط روی گوشی.
 */
export const RecordingSaveStatus: React.FC<{
  recordingUnavailable: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  savedFileName: string | null;
  onOpenRecordings: () => void;
  t: (key: string) => string;
}> = ({ recordingUnavailable, saveState, savedFileName, onOpenRecordings, t }) => (
  <>
    {recordingUnavailable ? (
      <View style={[feedbackCardStyles.feedbackCard, feedbackCardStyles.feedbackCardError]}>
        <Text style={feedbackCardStyles.feedbackErrorText}>{t('recordingUnavailable')}</Text>
      </View>
    ) : (
      <Text style={styles.holdToRecordHint}>{t('holdToRecord')}</Text>
    )}

    {saveState !== 'idle' && (
      <View style={[styles.saveStatusRow, saveState === 'error' ? styles.saveStatusRowError : null]}>
        {saveState === 'saving' ? (
          <>
            <Save size={13} color={COLORS.textSecondary} />
            <Text style={styles.saveStatusText} numberOfLines={1}>
              {t('savingRecording')}
            </Text>
          </>
        ) : saveState === 'saved' ? (
          <>
            <Check size={13} color={COLORS.tertiary} />
            <Text style={styles.saveStatusText} numberOfLines={1}>
              {savedFileName || t('recordingSaved')}
            </Text>
            <TouchableOpacity onPress={onOpenRecordings}>
              <Text style={styles.saveStatusLink}>{t('myRecordings')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.saveStatusText, { color: COLORS.error }]} numberOfLines={1}>
            {t('recordingSaveFailed')}
          </Text>
        )}
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
  holdToRecordHint: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  saveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.tertiaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  saveStatusRowError: {
    backgroundColor: 'rgba(186, 26, 26, 0.10)',
  },
  saveStatusText: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  saveStatusLink: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
});
