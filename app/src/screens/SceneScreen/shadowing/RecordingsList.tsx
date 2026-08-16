import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

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
  t,
}) => {
  const recordedCount = recordedLines.length;

  return (
    <View style={styles.recListCard}>
      <View style={styles.recListHeader}>
        <Text style={styles.recListTitle}>
          {t('myLinesTitle')} ({recordedCount}/{lines.length})
        </Text>
        <TouchableOpacity
          style={[styles.recPlayAllBtn, recordedCount === 0 ? styles.recBtnDisabled : null]}
          disabled={recordedCount === 0}
          onPress={isPlayingAll ? onStopPlayAll : onPlayAll}
        >
          {isPlayingAll ? (
            <Pause size={12} color={COLORS.white} fill={COLORS.white} />
          ) : (
            <Play size={12} color={COLORS.white} fill={COLORS.white} />
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
                <Play size={13} color={COLORS.primary} fill={COLORS.primary} />
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
  recListCard: {
    marginTop: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recListTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  recPlayAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  recPlayAllText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
  },
  recBtnDisabled: {
    opacity: 0.4,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  recRowActive: {
    backgroundColor: COLORS.primaryLight,
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
    fontSize: 10,
  },
  recRowNumDone: {
    color: COLORS.tertiary,
  },
  recRowText: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
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
