import React from 'react';

import type { DialogueItem } from '../../../data/scenarios';
import type { EvaluationResult } from '../../../api/shadowing';
import { HighlightedDialogueText } from './HighlightedDialogueText';
import { MaskedDialogueText } from './MaskedDialogueText';
import { ScoredDialogueText } from './ScoredDialogueText';

/**
 * رندرِ خودِ جمله:
 *  - اگر ارزیابی هوش مصنوعی آماده باشد: با کلمات رنگی نمره‌دهی‌شده (سبز/زرد/قرمز)
 *  - اگر در مرحله ضبط و متن مخفی باشد: ماسک‌شده
 *  - در غیر این صورت: هایلایت زنده کلمه‌به‌کلمه همگام با صوت
 */
export const DialogueSentenceContent: React.FC<{
  activeStepIndex: number;
  currentDialogue: DialogueItem;
  textRevealed: boolean;
  masterPositionSeconds?: number;
  evaluation?: EvaluationResult;
  recordingPositionSeconds?: number;
  /** برای جای‌گیری داخل حباب کوچکِ بالای شخصیت. */
  compact?: boolean;
}> = ({
  activeStepIndex,
  currentDialogue,
  textRevealed,
  masterPositionSeconds,
  evaluation,
  recordingPositionSeconds,
  compact,
}) => {
  // اگر نمره‌دهی انجام شده باشد، فیدبک هوشمند روی کلمات نمایش می‌یابد
  if (evaluation?.words && evaluation.words.length > 0) {
    return (
      <ScoredDialogueText
        words={evaluation.words}
        currentTimeSeconds={recordingPositionSeconds}
      />
    );
  }

  if (activeStepIndex === 2 && !textRevealed) {
    return (
      <MaskedDialogueText
        text={currentDialogue.dialogue || 'Great. Can I pay by card?'}
        compact={compact}
      />
    );
  }

  return (
    <HighlightedDialogueText
      text={currentDialogue.dialogue || 'Great. Can I pay by card?'}
      wordTimings={currentDialogue.wordTimings}
      currentTimeSeconds={masterPositionSeconds}
      compact={compact}
    />
  );
};
