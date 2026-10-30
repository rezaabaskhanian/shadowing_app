import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { STEP_ACCENT_COLOR } from './StepTabs';

// این کامپوننت فقط توی مرحله‌ی «ضبط» رندر می‌شود، پس مستقیم رنگ همون مرحله
// (نارنجی) را می‌گیرد؛ نسخه‌ی تیره‌ترش برای کنتراست کافی با متن/آیکون سفید.
const RECORD_ACCENT = STEP_ACCENT_COLOR[2];

/**
 * لیست جمله‌های صحنه با وضعیت ضبطشان.
 *
 * هم راهِ گوش‌دادن دوباره به هر جمله است، هم نقشه‌ی پیشرفت: یک نگاه کافی است
 * تا کاربر ببیند کدام جمله‌ها مانده‌اند.
 */
export const RecordingsList: React.FC<{
  lines: string[];
  recordedLines: number[];
  activeLineIndex: number;
  onPlayLine: (index: number) => void;
  onSelectLine: (index: number) => void;
  onPlayAll: () => void;
  onStopPlayAll: () => void;
  isPlayingAll: boolean;
  rtl?: boolean;
  t: (key: string) => string;
}> = ({
  lines,
  recordedLines,
  activeLineIndex,
  onPlayLine,
  onSelectLine,
  onPlayAll,
  onStopPlayAll,
  isPlayingAll,
  rtl = false,
  t,
}) => {
  const recordedCount = recordedLines.length;

  return (
    <View style={styles.recListCard}>
      <View style={[styles.recListHeader, rtl && styles.rowReverse]}>
        <Text style={styles.recListTitle}>
          {t('myLinesTitle')} ({recordedCount}/{lines.length})
        </Text>
        <TouchableOpacity
          style={[
            styles.recPlayAllBtn,
            rtl && styles.rowReverse,
            recordedCount === 0 ? styles.recBtnDisabled : null,
          ]}
          disabled={recordedCount === 0}
          onPress={isPlayingAll ? onStopPlayAll : onPlayAll}
        >
          {isPlayingAll ? (
            <Pause size={11} color={RECORD_ACCENT} fill={RECORD_ACCENT} />
          ) : (
            <Play size={11} color={RECORD_ACCENT} fill={RECORD_ACCENT} />
          )}
          <Text style={styles.recPlayAllText}>
            {isPlayingAll ? t('stopPlayAll') : t('playAllMine')}
          </Text>
        </TouchableOpacity>
      </View>

      {lines.map((line, idx) => {
        const recorded = recordedLines.includes(idx);
        const active = idx === activeLineIndex;
        return (
          <View key={idx} style={[styles.recRow, active ? styles.recRowActive : null]}>
            {/* زدن روی متن، همان جمله را انتخاب می‌کند تا بشود دوباره ضبطش کرد */}
            <TouchableOpacity style={styles.recRowTextWrap} onPress={() => onSelectLine(idx)}>
              <Text style={[styles.recRowNum, recorded ? styles.recRowNumDone : null]}>
                {idx + 1}
              </Text>
              <Text
                style={[styles.recRowText, recorded ? null : styles.recRowTextPending]}
                numberOfLines={1}
              >
                {line}
              </Text>
            </TouchableOpacity>

            {recorded ? (
              <TouchableOpacity style={styles.recRowPlayBtn} onPress={() => onPlayLine(idx)}>
                <Play size={13} color={RECORD_ACCENT} fill={RECORD_ACCENT} />
              </TouchableOpacity>
            ) : (
              <View style={styles.recRowPendingDot} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  recListCard: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
  },
  recListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  recListTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  recPlayAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  recPlayAllText: {
    color: RECORD_ACCENT,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  recBtnDisabled: {
    opacity: 0.4,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  recRowActive: {
    backgroundColor: '#FDF6E9',
  },
  recRowTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recRowNum: {
    width: 18,
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  recRowNumDone: {
    color: COLORS.tertiary,
  },
  recRowText: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    writingDirection: 'ltr',
  },
  recRowTextPending: {
    color: COLORS.muted,
  },
  recRowPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  recRowPendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 10,
    backgroundColor: COLORS.border,
  },
});
