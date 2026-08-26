import React from 'react';
import { View } from 'react-native';

import type { DialogueItem } from '../../../data/scenarios';
import type { EvaluationResult } from '../../../api/shadowing';
import type { AudioActionCommand } from '../types';
import type { TextDisplayMode } from '../../../data/PracticeSettingsContext';

import { StepTabs } from './StepTabs';
import { LineChipsRow } from './LineChipsRow';
import { RepeatProgressRow } from './RepeatProgressRow';
import { DialogueSentenceBox } from './DialogueSentenceBox';
import { PracticeWaveformCard } from './PracticeWaveformCard';
import { RecordingSaveStatus } from './RecordingSaveStatus';
import { RecordingsList } from './RecordingsList';

interface ShadowingPracticePanelProps {
  language: string;
  t: (key: string) => string;
  activeStepIndex: number;
  onChangeStep: (stepIdx: number) => void;
  currentDialogue: DialogueItem;
  playing: boolean;
  actionCommand: AudioActionCommand;
  onOpenLeitner: () => void;
  /** رفتن به صفحه‌ی «ضبط‌های من» برای گوش‌دادن دوباره به ضبط‌های قبلی. */
  onOpenRecordings: () => void;
  /** وضعیت ذخیره‌ی آخرین ضبط روی گوشی. */
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  /** نام فایلی که روی گوشی ساخته شد (برای نشان‌دادن به کاربر). */
  savedFileName: string | null;
  /** نتیجه‌ی نمره‌دهی تلفظ برای همین جمله (اگر ضبطی ارزیابی شده باشد). */
  evaluation?: EvaluationResult;
  /** وضعیت درخواست نمره‌دهی. */
  evalState: 'idle' | 'scoring' | 'done' | 'error';
  /** پیام خطای نمره‌دهی، برای وقتی که شبکه یا سرور مشکل داشته. */
  evalError: string | null;
  /** فرستادن ضبط جمله‌ی جاری برای نمره‌دهی (دکمه‌ی مرحله‌ی مقایسه). */
  onScoreCurrentLine: () => void;

  /** اندیس جمله‌هایی که کاربر ضبطشان کرده. */
  recordedLines: number[];
  /** آیا جمله‌ی جاری ضبط دارد (برای فعال/غیرفعال کردن دکمه‌های پخش). */
  hasRecordingForCurrentLine: boolean;
  /** پخش ضبط جمله‌ی جاری. */
  onPlayMyRecording: () => void;
  /** پخش ضبط یک جمله‌ی مشخص از لیست. */
  onPlayRecordingOfLine: (lineIndex: number) => void;
  /** پخش صدای مرجع جمله‌ی جاری. */
  onPlayOriginal: () => void;
  /** پخش پشت‌سرهم همه‌ی ضبط‌های صحنه. */
  onPlayAllRecordings: () => void;
  onStopPlayAll: () => void;
  isPlayingAll: boolean;
  /** متن همه‌ی جمله‌های صحنه، برای لیست ضبط‌ها. */
  dialogueLines: string[];
  activeLineIndex: number;
  /** انتخاب یک جمله از لیست (برای ضبط دوباره‌ی همان جمله). */
  onSelectLine: (lineIndex: number) => void;

  /** آیا کاربر متن این جمله را آشکار کرده (در مرحله‌ی ضبط پیش‌فرض مخفی است). */
  textRevealed: boolean;
  onToggleRevealText: () => void;
  /**
   * true یعنی وب‌ویو اصلاً امکان ضبط ندارد (origin ناامن یا نبود
   * MediaRecorder). به‌جای اینکه دکمه بی‌صدا کار نکند، به کاربر گفته می‌شود.
   */
  recordingUnavailable: boolean;
  /** چندمین دورِ پخش دیالوگ‌ها در مرحله‌ی فعلی (۱ تا totalRepeats). */
  repeatCount: number;
  /** دورِ پیشنهادی این مرحله (از تنظیمات کاربر)؛ ۰ یعنی بی‌نهایت. */
  totalRepeats: number;
  /** آیا این مرحله دور خودکار دارد؛ false یعنی با سرعت خود کاربر پیش می‌رود. */
  autoRepeat: boolean;
  /** مرحله‌هایی که تا آخر رفته شده‌اند (فقط برای تیکِ روی تب). */
  completedSteps: number[];
  /** رفتن دستی به مرحله‌ی بعد، بدون منتظرماندن برای دورهای خودکار. */
  onNextStep: () => void;

  /** موقعیتِ زنده‌ی پخشِ صدای مرجع (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه. */
  masterPositionSeconds?: number;
  /** موقعیتِ زنده‌ی پخشِ ضبطِ کاربر (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه در Compare. */
  recordingPositionSeconds?: number;
  /** جمله در حباب بالای شخصیت نشان داده شود یا کارتِ پایین. */
  textDisplayMode: TextDisplayMode;
  onChangeTextDisplayMode: (mode: TextDisplayMode) => void;
}

/**
 * پنل تمرینِ ۴مرحله‌ای (Listen / Shadow / Record / Compare).
 *
 * این فایل فقط چیدمان و مسیردهیِ state است؛ هر بخش بصری کامپوننت جدای خودش
 * را در همین پوشه دارد:
 *  - StepTabs             → نوار تب‌های بالا
 *  - RepeatProgressRow     → شمارنده‌ی دور + دکمه‌ی مرحله بعد
 *  - DialogueSentenceBox   → متن جمله (مخفی/هایلایت) + ترجمه + لغت‌ها
 *  - PracticeWaveformCard  → کارت وسط (شامل CompareAudioSection برای مرحله ۴)
 *  - RecordingSaveStatus   → راهنما/هشدار ضبط + وضعیت ذخیره‌ی روی گوشی
 *  - RecordingsList        → لیست جمله‌های صحنه با وضعیت ضبطشان
 *
 * دکمه‌های کنترل (`PlayerControlsBar`) اینجا رندر نمی‌شوند — SceneScreen آن‌ها
 * را به‌همراه جمله‌ی جاری به‌صورت نواری ثابت پایین صفحه نگه می‌دارد تا با
 * اسکرول‌شدنِ این پنل (مثلاً وقتی لیست جمله‌ها در مرحله‌ی ضبط زیاد می‌شود)
 * ناپدید نشوند.
 */
export const ShadowingPracticePanel: React.FC<ShadowingPracticePanelProps> = ({
  language,
  t,
  activeStepIndex,
  onChangeStep,
  currentDialogue,
  playing,
  actionCommand,
  onOpenLeitner,
  onOpenRecordings,
  saveState,
  savedFileName,
  evaluation,
  evalState,
  evalError,
  onScoreCurrentLine,
  recordedLines,
  hasRecordingForCurrentLine,
  onPlayMyRecording,
  onPlayRecordingOfLine,
  onPlayOriginal,
  onPlayAllRecordings,
  onStopPlayAll,
  isPlayingAll,
  dialogueLines,
  activeLineIndex,
  onSelectLine,
  textRevealed,
  onToggleRevealText,
  recordingUnavailable,
  repeatCount,
  totalRepeats,
  autoRepeat,
  completedSteps,
  onNextStep,
  masterPositionSeconds,
  recordingPositionSeconds,
  textDisplayMode,
  onChangeTextDisplayMode,
}) => {
  return (
    <View>
      <StepTabs
        language={language}
        activeStepIndex={activeStepIndex}
        completedSteps={completedSteps}
        onChangeStep={onChangeStep}
        t={t}
      />

      {activeStepIndex === 2 && dialogueLines.length > 1 && (
        <LineChipsRow
          lineCount={dialogueLines.length}
          recordedLines={recordedLines}
          activeLineIndex={activeLineIndex}
          onSelectLine={onSelectLine}
        />
      )}

      <RepeatProgressRow
        autoRepeat={autoRepeat}
        repeatCount={repeatCount}
        totalRepeats={totalRepeats}
        onNextStep={onNextStep}
        t={t}
      />

      <DialogueSentenceBox
        activeStepIndex={activeStepIndex}
        currentDialogue={currentDialogue}
        textRevealed={textRevealed}
        onToggleRevealText={onToggleRevealText}
        onOpenLeitner={onOpenLeitner}
        masterPositionSeconds={masterPositionSeconds}
        textDisplayMode={textDisplayMode}
        onChangeTextDisplayMode={onChangeTextDisplayMode}
        t={t}
      />

      <PracticeWaveformCard
        activeStepIndex={activeStepIndex}
        playing={playing}
        actionCommand={actionCommand}
        hasRecordingForCurrentLine={hasRecordingForCurrentLine}
        onPlayOriginal={onPlayOriginal}
        onPlayMyRecording={onPlayMyRecording}
        evaluation={evaluation}
        evalState={evalState}
        evalError={evalError}
        onScoreCurrentLine={onScoreCurrentLine}
        recordingPositionSeconds={recordingPositionSeconds}
        isPlayingRecording={actionCommand === 'play_recording'}
        t={t}
      />

      {activeStepIndex === 2 && (
        <RecordingSaveStatus
          recordingUnavailable={recordingUnavailable}
          saveState={saveState}
          savedFileName={savedFileName}
          onOpenRecordings={onOpenRecordings}
          t={t}
        />
      )}

      {activeStepIndex === 2 && dialogueLines.length > 0 && (
        <RecordingsList
          lines={dialogueLines}
          recordedLines={recordedLines}
          activeLineIndex={activeLineIndex}
          onPlayLine={onPlayRecordingOfLine}
          onSelectLine={onSelectLine}
          onPlayAll={onPlayAllRecordings}
          onStopPlayAll={onStopPlayAll}
          isPlayingAll={isPlayingAll}
          t={t}
        />
      )}
    </View>
  );
};
