import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, hexToRgba } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { WordTimingEntry } from '../../../data/scenarios';
import { usePracticeSettings } from '../../../data/PracticeSettingsContext';
import { analyzeProsody, type ProsodyToken } from '../../../utils/prosody';

function activeWordIndex(timings: WordTimingEntry[], currentTimeSeconds: number): number {
  let idx = -1;
  for (let i = 0; i < timings.length; i++) {
    if (currentTimeSeconds >= timings[i].start) idx = i;
    else break;
  }
  return idx;
}

export const ProsodyAnnotatedText: React.FC<{
  text: string;
  wordTimings?: WordTimingEntry[];
  currentTimeSeconds?: number;
  compact?: boolean;
}> = ({ text, wordTimings, currentTimeSeconds = 0, compact }) => {
  const { highlightColor } = usePracticeSettings();

  const analysis = useMemo(() => analyzeProsody(text), [text]);
  const tokens = analysis.tokens;

  const canHighlight = !!wordTimings && wordTimings.length > 0 && wordTimings.length === tokens.length;

  const activeIdx = useMemo(() => {
    if (canHighlight) {
      return activeWordIndex(wordTimings!, currentTimeSeconds);
    }
    if (currentTimeSeconds <= 0 || tokens.length === 0) return -1;
    const estimatedTotalSeconds = Math.max(1.5, tokens.length * 0.38);
    const progress = Math.min(1, Math.max(0, currentTimeSeconds / estimatedTotalSeconds));
    const rawIdx = Math.floor(progress * tokens.length);
    return Math.min(tokens.length - 1, rawIdx);
  }, [canHighlight, wordTimings, currentTimeSeconds, tokens.length]);

  return (
    <View style={styles.container}>
      <Text style={[styles.dialogueText, compact && styles.dialogueTextCompact]}>
        {tokens.map((token: ProsodyToken, idx: number) => {
          const isActive = idx === activeIdx;

          // استایل کلمه: اگر استرس داشته باشد پررنگ‌تر و باصلابت‌تر است
          const wordStyle = [
            styles.baseWord,
            token.isStressed ? styles.stressedWord : styles.unstressedWord,
            isActive && [
              styles.activeWord,
              { color: highlightColor, backgroundColor: hexToRgba(highlightColor, 0.15) },
            ],
          ];

          return (
            <React.Fragment key={idx}>
              {token.prefixPunct ? <Text style={styles.punct}>{token.prefixPunct}</Text> : null}

              <Text style={wordStyle}>
                {token.cleanWord}
              </Text>

              {token.suffixPunct ? <Text style={styles.punct}>{token.suffixPunct}</Text> : null}

              {/* نماد اتصال آوایی کلمات (Connected Speech) */}
              {token.linksToNext ? (
                <Text style={styles.linkingSymbol}>‿</Text>
              ) : (
                ' '
              )}

              {/* نماد مکث طبیعی بین عبارات فکری */}
              {token.hasPauseAfter && idx < tokens.length - 1 ? (
                <Text style={styles.pauseSymbol}> / </Text>
              ) : null}
            </React.Fragment>
          );
        })}

        {/* نماد افت‌وخیز لحن در انتهای جمله */}
        <Text
          style={[
            styles.intonationBadge,
            analysis.intonation === 'rising' ? styles.risingBadge : styles.fallingBadge,
          ]}
        >
          {` ${analysis.intonationSymbol}`}
        </Text>
      </Text>

      {/* راهنمای بصری زیر جمله در حالت غیرفشرده */}
      {!compact && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#111827' }]} />
            <Text style={styles.legendText}>کلمات تیره: تکیه صدا (Stress)</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendLinkIcon}>‿</Text>
            <Text style={styles.legendText}>اتصال صداها (Linking)</Text>
          </View>
          <View style={styles.legendItem}>
            <Text
              style={[
                styles.legendIntonationIcon,
                analysis.intonation === 'rising' ? { color: '#059669' } : { color: '#D97706' },
              ]}
            >
              {analysis.intonationSymbol}
            </Text>
            <Text style={styles.legendText}>
              {analysis.intonation === 'rising' ? 'لحن خیزان (Rising)' : 'لحن افتان (Falling)'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dialogueText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 6,
    color: COLORS.text,
  },
  dialogueTextCompact: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 0,
  },
  baseWord: {
    borderRadius: 6,
  },
  // کلمات دارای استرس: پررنگ و برجسته
  stressedWord: {
    fontWeight: '800',
    color: '#0F172A',
  },
  // کلمات گرامری کم‌اهمیت‌تر: ملایم‌تر
  unstressedWord: {
    fontWeight: '500',
    color: '#64748B',
  },
  activeWord: {
    fontWeight: '900',
    borderRadius: 6,
  },
  punct: {
    color: '#334155',
    fontWeight: '600',
  },
  // علامت اتصال صوتی
  linkingSymbol: {
    color: '#3B82F6',
    fontWeight: '900',
    fontSize: 18,
  },
  // علامت مکث
  pauseSymbol: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 16,
  },
  // فلش لحن صدا
  intonationBadge: {
    fontWeight: '900',
    fontSize: 20,
  },
  risingBadge: {
    color: '#059669', // سبز برای خیزان
  },
  fallingBadge: {
    color: '#D97706', // کهربایی/نارنجی برای افتان
  },
  // نوار راهنمای ریتم
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(241, 245, 249, 0.7)',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLinkIcon: {
    color: '#3B82F6',
    fontWeight: '900',
    fontSize: 12,
  },
  legendIntonationIcon: {
    fontWeight: '900',
    fontSize: 12,
  },
  legendText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    color: '#64748B',
  },
});
