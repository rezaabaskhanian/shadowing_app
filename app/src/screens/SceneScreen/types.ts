import type React from 'react';
import type { AudioPlayer } from '../../components/AudioPlayer';

/**
 * نوع دستورهای صوتی، مستقیماً از پراپ‌های خودِ AudioPlayer مشتق می‌شود تا اگر
 * آنجا تغییر کرد، اینجا هم بدون دست‌کاری دستی هماهنگ بماند.
 */
export type AudioActionCommand = NonNullable<
  React.ComponentProps<typeof AudioPlayer>['actionCommand']
>;
