import React from 'react';

import type { DialogueItem } from '../../../data/scenarios';
import { HighlightedDialogueText } from './HighlightedDialogueText';
import { MaskedDialogueText } from './MaskedDialogueText';

/**
 * رندرِ خودِ جمله (مخفی در مرحله‌ی ضبط، یا هایلایت‌شده‌ی کلمه‌به‌کلمه در بقیه‌ی
 * مرحله‌ها) — جدا از بقیه‌ی محتوای جعبه (ترجمه/لغت‌ها/بنرها) چون همین یک تکه
 * یا داخل کارتِ پایین رندر می‌شود یا داخل حبابِ بالای شخصیت، هرگز هر دو با هم
 * (نگاه کنید به [[TextDisplayMode]] در PracticeSettingsContext).
 */
export const DialogueSentenceContent: React.FC<{
  activeStepIndex: number;
  currentDialogue: DialogueItem;
  textRevealed: boolean;
  masterPositionSeconds?: number;
  /** برای جای‌گیری داخل حباب کوچکِ بالای شخصیت. */
  compact?: boolean;
}> = ({ activeStepIndex, currentDialogue, textRevealed, masterPositionSeconds, compact }) =>
  activeStepIndex === 2 && !textRevealed ? (
    <MaskedDialogueText text={currentDialogue.dialogue || 'Great. Can I pay by card?'} compact={compact} />
  ) : (
    <HighlightedDialogueText
      text={currentDialogue.dialogue || 'Great. Can I pay by card?'}
      wordTimings={currentDialogue.wordTimings}
      currentTimeSeconds={masterPositionSeconds}
      compact={compact}
    />
  );
