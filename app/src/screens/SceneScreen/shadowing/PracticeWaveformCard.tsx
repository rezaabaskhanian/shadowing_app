import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mic, RotateCcw, Sparkles, Square, Volume2 } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import type { AudioActionCommand } from '../types';
import type { EvaluationResult } from '../../../api/shadowing';
import type { PracticeFlowMode } from '../../../data/PracticeSettingsContext';
import { WaveBars } from './WaveBars';
import { CompareAudioSection } from './CompareAudioSection';
import { ProsodyFeedbackCard } from './ProsodyFeedbackCard';

const toLocaleDigits = (n: number | string, isRtl: boolean) =>
  isRtl ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n);

/**
 * کارت ویوفرم وسط پنل تمرین. محتوایش کاملاً به مرحله‌ی فعلی بستگی دارد:
 *  - Shadow (۱): دو موج (مرجع/کاربر) کنار هم، صرفاً تزئینی.
 *  - Compare (۳): بخش A/B واقعی + نمره‌دهی (`CompareAudioSection`).
 *  - بقیه (Listen/Record): یک ردیف موجِ عمومی با نشانگر پخش وسط.
 */
export const PracticeWaveformCard: React.FC<{
  activeStepIndex: number;
  /** رنگ اختصاصیِ مرحله‌ی فعلی؛ فقط برای موجِ عمومیِ Listen/Record استفاده می‌شود
   * (Shadow و Compare رنگ‌های معناداری از قبل دارند: صدای مرجع/خودت). */
  accentColor: string;
  playing: boolean;
  actionCommand: AudioActionCommand;
  hasRecordingForCurrentLine: boolean;
  onPlayOriginal: () => void;
  onPlayMyRecording: () => void;
  evaluation?: EvaluationResult;
  evalState: 'idle' | 'scoring' | 'done' | 'error';
  evalError: string | null;
  onScoreCurrentLine: () => void;
  /** موقعیتِ زنده‌ی پخشِ ضبطِ کاربر (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه در Compare. */
  recordingPositionSeconds?: number;
  /** true وقتی همین حالا ضبطِ کاربر (نه صدای مرجع) در حال پخش است. */
  isPlayingRecording?: boolean;
  rtl?: boolean;
  t: (key: string) => string;
  /** وضعیت جریان سایه‌زنی تعاملی */
  shadowPromptState?: 'idle' | 'waiting_ready' | 'mumbling' | 'countdown' | 'recording' | 'feedback';
  countdownNum?: number;
  onConfirmReady?: () => void;
  onStartMumbling?: () => void;
  onStopRecord?: () => void;
  onReplayCurrent?: () => void;
  flowMode?: PracticeFlowMode;
}> = ({
  activeStepIndex,
  accentColor,
  playing,
  actionCommand,
  hasRecordingForCurrentLine,
  onPlayOriginal,
  onPlayMyRecording,
  evaluation,
  evalState,
  evalError,
  onScoreCurrentLine,
  recordingPositionSeconds,
  isPlayingRecording,
  rtl = false,
  t,
  shadowPromptState = 'idle',
  countdownNum = 3,
  onConfirmReady,
  onStartMumbling,
  onStopRecord,
  onReplayCurrent,
  flowMode = 'smart_flow',
}) => (
  <View
    style={[
      styles.waveformCard,
      activeStepIndex === 0 && styles.waveformCardListen,
      activeStepIndex === 3 && styles.waveformCardCompare,
    ]}
  >
    {activeStepIndex === 1 ? (
      <View style={styles.shadowCoachWrap}>
        {flowMode === 'classic_steps' ? (
          <View style={styles.classicShadowCard}>
            <View style={[styles.classicShadowHeader, rtl && styles.rowReverse]}>
              <View style={styles.classicShadowIconBadge}>
                <Volume2 size={20} color={COLORS.primary} />
              </View>
              <View style={[styles.classicShadowTexts, rtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.classicShadowTitle}>
                  {rtl ? 'هم‌خوانی هم‌زمان (سایه‌زنی)' : 'Simultaneous Shadowing'}
                </Text>
                <Text style={[styles.classicShadowDesc, rtl && { textAlign: 'right' }]}>
                  {rtl
                    ? 'هم‌زمان با پخش صدا، با گوینده تکرار کنید. در این مرحله صدایی ضبط نمی‌شود تا با آرامش تمرین کنید؛ ضبط مستقل در مرحله‌ی بعد است.'
                    : 'Repeat aloud alongside the audio. Your voice is not recorded here so you can practice freely; solo recording is in the next step.'}
                </Text>
              </View>
            </View>
            <View style={styles.classicWaveWrap}>
              <WaveBars active={playing} color={COLORS.primary} />
            </View>
          </View>
        ) : evalState === 'scoring' ? (
          <View style={styles.scoringCard}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.scoringText}>🤖 هوش مصنوعی در حال تحلیل تلفظ و لهجه...</Text>
          </View>
        ) : shadowPromptState === 'waiting_ready' ? (
          <View style={styles.readyCard}>
            <View style={[styles.readyHeader, rtl && styles.rowReverse]}>
              <View style={styles.readyMicBadge}>
                <Sparkles size={18} color="#FFF" />
              </View>
              <View style={[styles.readyTexts, rtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.readyTitle}>
                  {rtl ? '✨ نوبت شماست!' : '✨ Your Turn!'}
                </Text>
                <Text style={[styles.readySubtitle, rtl && { textAlign: 'right' }]}>
                  {rtl
                    ? 'می‌توانید مستقیم وارد ضبط شوید یا ابتدا با زمزمه آرام گرم کنید'
                    : 'Start full shadowing now or do a quick mumbling warm-up'}
                </Text>
              </View>
            </View>
            <View style={[styles.readyActionsRow, rtl && styles.rowReverse]}>
              <TouchableOpacity
                style={styles.readyPrimaryBtn}
                onPress={onConfirmReady}
                activeOpacity={0.85}
              >
                <Sparkles size={14} color="#FFF" />
                <Text style={styles.readyPrimaryBtnText}>
                  {rtl ? 'آماده‌ام! شروع شادوئینگ 🚀' : "I'm Ready! Let's Go 🚀"}
                </Text>
              </TouchableOpacity>
              {onStartMumbling && (
                <TouchableOpacity
                  style={styles.readyMumbleBtn}
                  onPress={onStartMumbling}
                  activeOpacity={0.85}
                >
                  <Volume2 size={13} color="#7C3AED" />
                  <Text style={styles.readyMumbleBtnText}>
                    {rtl ? '🗣️ گرم‌کردن با زمزمه' : '🗣️ Mumble Warm-up'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : shadowPromptState === 'mumbling' ? (
          <View style={styles.mumblingCard}>
            <View style={[styles.mumblingHeader, rtl && styles.rowReverse]}>
              <View style={styles.mumblingBadge}>
                <Volume2 size={18} color="#7C3AED" />
              </View>
              <View style={[styles.mumblingTexts, rtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.mumblingTitle}>
                  {rtl ? '🗣️ حالت زمزمه و گرم‌کردن (Mumbling)' : '🗣️ Mumbling & Warm-up Mode'}
                </Text>
                <Text style={[styles.mumblingDesc, rtl && { textAlign: 'right' }]}>
                  {rtl
                    ? 'بدون استرس ضبط، زیر لب همراه با گوینده زمزمه کنید تا ریتم در دهان بنشیند.'
                    : 'Murmur along with the speaker, matching rhythm without worrying about perfect articulation.'}
                </Text>
              </View>
            </View>
            <View style={styles.mumblingWaveWrap}>
              <WaveBars active={playing} color="#7C3AED" />
            </View>
            <View style={[styles.mumblingActionsRow, rtl && styles.rowReverse]}>
              <TouchableOpacity
                style={styles.mumblingReadyBtn}
                onPress={onConfirmReady}
                activeOpacity={0.85}
              >
                <Sparkles size={14} color="#FFF" />
                <Text style={styles.mumblingReadyBtnText}>
                  {rtl ? 'حالا آماده شادوئینگ کامل هستم! 🚀' : 'Ready for Full Shadowing 🚀'}
                </Text>
              </TouchableOpacity>
              {onStartMumbling && (
                <TouchableOpacity
                  style={styles.mumblingReplayBtn}
                  onPress={onStartMumbling}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={13} color="#7C3AED" />
                  <Text style={styles.mumblingReplayBtnText}>
                    {rtl ? 'تکرار زمزمه' : 'Re-mumble'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : shadowPromptState === 'countdown' ? (
          <View style={styles.countdownCard}>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownNum}>{toLocaleDigits(countdownNum, rtl)}</Text>
            </View>
            <Text style={styles.countdownTitle}>
              {rtl
                ? countdownNum > 1
                  ? `آماده‌باش... ${toLocaleDigits(countdownNum, true)}`
                  : 'آماده‌باش... شروع صحبت! 🎙️'
                : countdownNum > 1
                  ? `Get ready... ${countdownNum}`
                  : 'Get ready... Speak now! 🎙️'}
            </Text>
            <Text style={styles.countdownSubtitle}>
              {rtl ? 'با ریتم طبیعی و واضح جمله را تکرار کنید' : 'Repeat clearly and with natural rhythm'}
            </Text>
          </View>
        ) : shadowPromptState === 'recording' || actionCommand === 'start_record' ? (
          <View style={styles.elsaSpeakingState}>
            <View style={styles.elsaMicPulseBadge}>
              <Mic size={22} color="#EF4444" />
            </View>
            <Text style={styles.elsaSpeakingTitle}>🔴 در حال ضبط خودکار صدای شما...</Text>
            <Text style={styles.elsaSpeakingSubtitle}>
              جمله را تکرار کنید؛ پس از اتمام دکمه پایان را بزنید
            </Text>
            <View style={styles.elsaWaveContainer}>
              <WaveBars active={true} color="#EF4444" />
            </View>
            {onStopRecord && (
              <TouchableOpacity
                style={styles.stopSpeechBtn}
                onPress={onStopRecord}
                activeOpacity={0.85}
              >
                <Square size={13} color="#FFF" fill="#FFF" />
                <Text style={styles.stopSpeechBtnText}>پایان گفتار ⏹️</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : shadowPromptState === 'feedback' && evaluation ? (
          <View style={styles.feedbackCard}>
            <View style={[styles.feedbackTopRow, rtl && styles.rowReverse]}>
              <View style={styles.feedbackScoreBadge}>
                <Text style={styles.feedbackScoreNum}>{Math.round(evaluation.overall_score)}٪</Text>
                <Text style={styles.feedbackScoreLabel}>
                  {evaluation.overall_score >= 80 ? 'عالی ✨' : 'خوب 💪'}
                </Text>
              </View>
              <View style={styles.feedbackTexts}>
                <Text style={styles.feedbackNextText}>جمله بعد در حال بارگذاری...</Text>
                <Text style={styles.feedbackDetailText}>
                  تلفظ: {Math.round(evaluation.pronunciation_score || evaluation.overall_score)}٪ · روانی: {Math.round(evaluation.fluency_score || evaluation.overall_score)}٪
                </Text>
              </View>
            </View>
            {onReplayCurrent && (
              <TouchableOpacity
                style={styles.retryCurrentBtn}
                onPress={onReplayCurrent}
                activeOpacity={0.8}
              >
                <RotateCcw size={13} color={COLORS.primary} />
                <Text style={styles.retryCurrentText}>تکرار همین جمله 🔄</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.elsaIdleState}>
            <View style={[styles.channelRow, rtl && styles.rowReverse]}>
              <View style={[styles.channelTag, { backgroundColor: 'rgba(36, 83, 219, 0.10)' }, rtl && styles.rowReverse]}>
                <Volume2 size={13} color={COLORS.audioOriginal} />
                <Text style={[styles.channelTagText, { color: COLORS.audioOriginal }]}>صدای گوینده (گوش دهید)</Text>
              </View>
              <View style={styles.channelWave}>
                <WaveBars active={playing} color={COLORS.audioOriginal} />
              </View>
            </View>
          </View>
        )}
      </View>
    ) : evalState === 'scoring' ? (
      <View style={styles.scoringCard}>
        <ActivityIndicator color={COLORS.primary} size="small" />
        <Text style={styles.scoringText}>🤖 هوش مصنوعی در حال تحلیل تلفظ و لهجه...</Text>
      </View>
    ) : evaluation ? (
      <View style={styles.smartResultCard}>
        <View style={[styles.smartResultTopRow, rtl && styles.rowReverse]}>
          <View style={styles.smartScoreBadge}>
            <Text style={styles.smartScoreNum}>{Math.round(evaluation.overall_score)}٪</Text>
            <Text style={styles.smartScoreLabel}>
              {evaluation.overall_score >= 80
                ? 'عالی و روان ✨'
                : evaluation.overall_score >= 60
                ? 'خوب، ادامه بده 💪'
                : 'نیاز به تمرین 💡'}
            </Text>
          </View>
          <View style={styles.smartScoreDetails}>
            <Text style={styles.smartScoreDetailItem}>
              تلفظ: {Math.round(evaluation.pronunciation_score || evaluation.overall_score)}٪
            </Text>
            <Text style={styles.smartScoreDetailItem}>
              روانی کلام: {Math.round(evaluation.fluency_score || evaluation.overall_score)}٪
            </Text>
          </View>
        </View>

        {/* ارزیابی سه‌گانه شادوئینگ: مکث، تکیه و لحن */}
        <ProsodyFeedbackCard
          targetText={evaluation.target_text}
          words={evaluation.words}
          fluencyScore={evaluation.fluency_score}
          overallScore={evaluation.overall_score}
          rtl={rtl}
        />

        <View style={[styles.smartActionRow, rtl && styles.rowReverse]}>
          <TouchableOpacity style={styles.smartRetryBtn} onPress={onPlayOriginal} activeOpacity={0.8}>
            <RotateCcw size={14} color={COLORS.primary} />
            <Text style={styles.smartRetryText}>تکرار جمله</Text>
          </TouchableOpacity>
          {hasRecordingForCurrentLine && (
            <TouchableOpacity style={styles.smartListenBtn} onPress={onPlayMyRecording} activeOpacity={0.8}>
              <Volume2 size={14} color="#2563EB" />
              <Text style={styles.smartListenText}>شنیدن صدای من</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ) : activeStepIndex === 3 ? (
      <CompareAudioSection
        hasRecordingForCurrentLine={hasRecordingForCurrentLine}
        onPlayOriginal={onPlayOriginal}
        onPlayMyRecording={onPlayMyRecording}
        evaluation={evaluation}
        evalState={evalState}
        evalError={evalError}
        onScoreCurrentLine={onScoreCurrentLine}
        recordingPositionSeconds={recordingPositionSeconds}
        isPlayingRecording={isPlayingRecording}
        rtl={rtl}
        t={t}
      />
    ) : (
      <View style={styles.waveformRow}>
        {Array.from({ length: 24 }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.waveBar,
              {
                height:
                  (activeStepIndex === 0 && playing) ||
                  (activeStepIndex === 2 && actionCommand === 'start_record')
                    ? 8 + ((idx * 7) % 20)
                    : 6 + ((idx * 11) % 16),
                backgroundColor: accentColor,
              },
            ]}
          />
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  waveformCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginVertical: 12,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  waveformCardListen: {
    backgroundColor: '#FAF7F2',
    borderColor: '#F0EBE3',
  },
  // در مقایسه، خودِ بخش‌ها کارت‌های جدا دارند.
  waveformCardCompare: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: 36,
    marginVertical: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  shadowCoachWrap: {
    width: '100%',
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 70,
  },
  channelTagText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  channelWave: {
    flex: 1,
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F7F5F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  syncStatusPillActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  syncStatusText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  scoringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  scoringText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  smartResultCard: {
    width: '100%',
    gap: 12,
  },
  smartResultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  smartScoreBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  smartScoreNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    color: '#059669',
  },
  smartScoreLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  smartScoreDetails: {
    flex: 1,
    gap: 4,
  },
  smartScoreDetailItem: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12.5,
    color: '#4B5563',
  },
  smartActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smartRetryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 100, 34, 0.1)',
    borderRadius: 12,
    paddingVertical: 9,
  },
  smartRetryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  smartListenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 12,
    paddingVertical: 9,
  },
  smartListenText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#2563EB',
  },
  elsaSpeakingState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  elsaMicPulseBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elsaSpeakingTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#DC2626',
    textAlign: 'center',
  },
  elsaSpeakingSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  elsaWaveContainer: {
    width: '100%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  elsaIdleState: {
    width: '100%',
    gap: 10,
  },
  elsaPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 100, 34, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  elsaPromptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 100, 34, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elsaPromptTexts: {
    flex: 1,
  },
  elsaPromptTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  elsaPromptSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  elsaButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  elsaBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 10,
    paddingVertical: 7,
  },
  elsaBtnPrimaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
    color: '#2563EB',
  },
  elsaBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 7,
  },
  elsaBtnSecondaryText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  readyCard: {
    width: '100%',
    gap: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
  },
  readyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readyMicBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  readyTexts: {
    flex: 1,
  },
  readyTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14.5,
    color: '#9A3412',
  },
  readySubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#7C2D12',
    marginTop: 2,
    lineHeight: 16,
  },
  readyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  readyPrimaryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    ...SHADOWS.level1,
  },
  readyPrimaryBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#FFF',
  },
  readyMumbleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 10,
  },
  readyMumbleBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#7C3AED',
  },
  // استایل‌های حالت زمزمه (Mumbling Mode)
  mumblingCard: {
    width: '100%',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 14,
  },
  mumblingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mumblingBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mumblingTexts: {
    flex: 1,
  },
  mumblingTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#5B21B6',
  },
  mumblingDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#6D28D9',
    marginTop: 2,
    lineHeight: 16,
  },
  mumblingWaveWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mumblingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  mumblingReadyBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 10,
    ...SHADOWS.level1,
  },
  mumblingReadyBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#FFF',
  },
  mumblingReplayBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingVertical: 10,
  },
  mumblingReplayBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#6D28D9',
  },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 11,
    ...SHADOWS.level1,
  },
  readyBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#FFF',
  },
  countdownCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  countdownBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  countdownNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    color: '#FFF',
  },
  countdownTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  countdownSubtitle: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#6B7280',
  },
  stopSpeechBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 6,
  },
  stopSpeechBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#FFF',
  },
  feedbackCard: {
    width: '100%',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackScoreBadge: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackScoreNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: '#15803D',
  },
  feedbackScoreLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#166534',
  },
  feedbackTexts: {
    flex: 1,
  },
  feedbackNextText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#166534',
  },
  feedbackDetailText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  retryCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 7,
  },
  retryCurrentText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
    color: COLORS.primary,
  },
  classicShadowCard: {
    width: '100%',
    gap: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
  },
  classicShadowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  classicShadowIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 100, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  classicShadowTexts: {
    flex: 1,
  },
  classicShadowTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#9A3412',
    marginBottom: 3,
  },
  classicShadowDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#7C2D12',
    lineHeight: 17,
  },
  classicWaveWrap: {
    width: '100%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
