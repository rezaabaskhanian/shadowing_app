import React, { useEffect, useState } from 'react';

import { getAssessmentTest, type AssessmentItem, type SubmitAssessmentResult } from '../../api/assessment';
import { PlacementTestIntroScreen } from './PlacementTestIntroScreen';
import { PlacementTestRecordScreen } from './PlacementTestRecordScreen';
import { PlacementTestResultScreen } from './PlacementTestResultScreen';

type FlowStep = 'loading' | 'intro' | 'recording' | 'result' | 'unavailable';

interface PlacementTestFlowProps {
  /**
   * اگر آیتم‌ها از قبل واکشی شده‌اند (مثلاً App.tsx برای گیتِ ورود قبلاً
   * getAssessmentTest را صدا زده)، همان‌ها را بده تا این کامپوننت دوباره
   * درخواست نزند. اگر ندهی، خودش روی mount واکشی می‌کند.
   */
  items?: AssessmentItem[] | null;
  onSkip: () => void;
  onDone: () => void;
}

/**
 * کانتینر بی‌ناوبریِ کل فلوی تست تعیین سطح: معرفی → ضبط سه آیتم → نتیجه.
 * اگر ادمین هنوز محتوایی نساخته باشد (getAssessmentTest → null/[])، بی‌سروصدا
 * onSkip را صدا می‌زند تا هیچ‌وقت چیزی برای کاربر دیده نشود.
 */
export const PlacementTestFlow: React.FC<PlacementTestFlowProps> = ({
  items: providedItems,
  onSkip,
  onDone,
}) => {
  const [step, setStep] = useState<FlowStep>(() => {
    if (providedItems === undefined) return 'loading';
    return providedItems && providedItems.length > 0 ? 'intro' : 'unavailable';
  });
  const [items, setItems] = useState<AssessmentItem[] | null>(providedItems ?? null);
  const [result, setResult] = useState<SubmitAssessmentResult | null>(null);

  useEffect(() => {
    if (providedItems !== undefined) return; // از قبل داده شده، نیازی به واکشی نیست.
    let active = true;
    getAssessmentTest()
      .then((data) => {
        if (!active) return;
        if (!data || data.length === 0) {
          setStep('unavailable');
          return;
        }
        setItems(data);
        setStep('intro');
      })
      .catch(() => {
        if (active) setStep('unavailable');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // اگر محتوا اصلاً نباشد، فیچر باید کاملاً نامرئی بماند — یک‌بار onSkip را
  // صدا می‌زنیم تا کالر (App.tsx یا Home) به حالت عادی برگردد.
  useEffect(() => {
    if (step === 'unavailable') onSkip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === 'loading' || step === 'unavailable') return null;

  if (step === 'intro') {
    return <PlacementTestIntroScreen onStart={() => setStep('recording')} onSkip={onSkip} />;
  }

  if (step === 'recording' && items) {
    return (
      <PlacementTestRecordScreen
        items={items}
        onSubmitted={(res) => {
          setResult(res);
          setStep('result');
        }}
      />
    );
  }

  if (step === 'result' && result && items) {
    return <PlacementTestResultScreen result={result} items={items} onContinue={onDone} />;
  }

  return null;
};
