import { useEffect, useRef, useState } from 'react';

/**
 * سقفِ طولِ ضبط: وقتی `active` (در حال ضبط) روشن است، ثانیه‌ها را می‌شمارد و
 * در `maxSeconds` تابع `onLimit` را (فقط یک بار) صدا می‌زند تا صفحه ضبط را ببندد.
 * ثانیه‌های گذشته برای نمایش شمارنده برمی‌گردد.
 *
 * چرا سقف؟ صدای بلندتر یعنی آپلود و رونویسیِ (Whisper) کندتر و هزینه‌ی بیشتر؛ یک
 * جوابِ ۲۰ ثانیه‌ای برای این تمرین‌ها کافی است.
 */
export function useRecordingLimit(active: boolean, maxSeconds: number, onLimit: () => void): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // آخرین onLimit را نگه می‌داریم تا تغییرِ آن، تایمرِ در حال اجرا را از نو نسازد.
  const onLimitRef = useRef(onLimit);
  useEffect(() => {
    onLimitRef.current = onLimit;
  }, [onLimit]);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setElapsedSeconds(Math.min(maxSeconds, Math.floor(elapsed)));
      if (elapsed >= maxSeconds && !fired) {
        fired = true;
        clearInterval(id);
        onLimitRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [active, maxSeconds]);

  return elapsedSeconds;
}
