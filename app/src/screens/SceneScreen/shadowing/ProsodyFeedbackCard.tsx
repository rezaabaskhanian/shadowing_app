import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, Sparkles, Activity, Music, Target } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import { evaluateShadowingProsody, type ProsodyEvaluation } from '../../../utils/prosody';
import type { WordScore } from '../../../api/shadowing';

interface ProsodyFeedbackCardProps {
  targetText: string;
  words?: WordScore[];
  fluencyScore?: number;
  overallScore?: number;
  rtl?: boolean;
}

export const ProsodyFeedbackCard: React.FC<ProsodyFeedbackCardProps> = ({
  targetText,
  words,
  fluencyScore = 75,
  overallScore = 75,
  rtl = true,
}) => {
  const [expanded, setExpanded] = useState(true);

  if (!targetText) return null;

  const prosody = evaluateShadowingProsody(targetText, words, fluencyScore, overallScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={[styles.headerRow, rtl && styles.rowReverse]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={[styles.headerTitleWrap, rtl && styles.rowReverse]}>
          <Sparkles size={16} color="#6366F1" />
          <Text style={styles.headerTitle}>ارزیابی سه‌گانه شادوئینگ (علمی)</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.badgeLabel}>
            {prosody.stressScore >= 75 && prosody.pauseAndLinkingScore >= 75 ? 'عالی 🌟' : 'نیاز به تمرین 💡'}
          </Text>
          {expanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* ۱. مکث و پیوستگی (Pauses & Linking) */}
          <View style={styles.factorItem}>
            <View style={[styles.factorHeader, rtl && styles.rowReverse]}>
              <View style={[styles.factorNameWrap, rtl && styles.rowReverse]}>
                <Activity size={14} color="#0EA5E9" />
                <Text style={styles.factorTitle}>مکث و پیوستگی گفتار (Pauses & Liaison)</Text>
              </View>
              <Text style={[styles.factorScore, { color: getScoreColor(prosody.pauseAndLinkingScore) }]}>
                {prosody.pauseAndLinkingScore}٪
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${prosody.pauseAndLinkingScore}%`,
                    backgroundColor: getScoreColor(prosody.pauseAndLinkingScore),
                  },
                ]}
              />
            </View>
            <Text style={[styles.factorFeedback, rtl && styles.textRight]}>
              {prosody.pauseAndLinkingFeedback}
            </Text>
          </View>

          {/* ۲. تکیه روی کلمات کلیدی (Sentence Stress) */}
          <View style={styles.factorItem}>
            <View style={[styles.factorHeader, rtl && styles.rowReverse]}>
              <View style={[styles.factorNameWrap, rtl && styles.rowReverse]}>
                <Target size={14} color="#8B5CF6" />
                <Text style={styles.factorTitle}>تکیه روی کلمات کلیدی (Sentence Stress)</Text>
              </View>
              <Text style={[styles.factorScore, { color: getScoreColor(prosody.stressScore) }]}>
                {prosody.stressScore}٪
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${prosody.stressScore}%`,
                    backgroundColor: getScoreColor(prosody.stressScore),
                  },
                ]}
              />
            </View>
            <Text style={[styles.factorFeedback, rtl && styles.textRight]}>
              {prosody.stressFeedback}
            </Text>
          </View>

          {/* ۳. ریتم و لحن پایان جمله (Intonation) */}
          <View style={[styles.factorItem, styles.factorItemLast]}>
            <View style={[styles.factorHeader, rtl && styles.rowReverse]}>
              <View style={[styles.factorNameWrap, rtl && styles.rowReverse]}>
                <Music size={14} color="#EC4899" />
                <Text style={styles.factorTitle}>لحن و فراز و فرود صدا (Intonation)</Text>
              </View>
              <Text style={[styles.factorScore, { color: getScoreColor(prosody.intonationScore) }]}>
                {prosody.intonationScore}٪
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${prosody.intonationScore}%`,
                    backgroundColor: getScoreColor(prosody.intonationScore),
                  },
                ]}
              />
            </View>
            <Text style={[styles.factorFeedback, rtl && styles.textRight]}>
              {prosody.intonationFeedback}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#334155',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#64748B',
  },
  body: {
    padding: 12,
    gap: 12,
  },
  factorItem: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  factorItemLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  factorNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factorTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
    color: '#1E293B',
  },
  factorScore: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorFeedback: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
