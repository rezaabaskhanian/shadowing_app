import { getCourse } from '../api/course';
import { getPodcasts } from '../api/podcasts';
import { getSpeakingTopics } from '../api/topicSpeaking';
import { getVideoClips } from '../api/videoClips';
import { getWritingPrompts } from '../api/writing';

/**
 * کدام بخش‌های تازه (قدم اول، ویدیو، پادکست، نوشتن، صحبت درباره‌ی موضوع)
 * واقعاً محتوا دارند؛ بخشی که ادمین هنوز چیزی برایش نساخته در منو نمایش داده
 * نمی‌شود. نتیجه‌ی آخر نگه داشته می‌شود تا منو با هر بار باز شدن خالی/پر نشود.
 */
export interface ContentAvailability {
  course: boolean;
  videoClips: boolean;
  podcasts: boolean;
  writing: boolean;
  topicSpeaking: boolean;
}

let last: ContentAvailability = {
  course: false,
  videoClips: false,
  podcasts: false,
  writing: false,
  topicSpeaking: false,
};

export const getCachedAvailability = () => last;

/** خطای شبکه برای یک بخش = همان وضعیت قبلی‌اش (نه پنهان شدن ناگهانی). */
const has = (p: Promise<unknown[]>, prev: boolean) => p.then((l) => l.length > 0).catch(() => prev);

export async function loadContentAvailability(): Promise<ContentAvailability> {
  const [course, videoClips, podcasts, writing, topicSpeaking] = await Promise.all([
    has(
      getCourse().then((units) => units.flatMap((u) => u.lessons || [])),
      last.course
    ),
    has(getVideoClips(), last.videoClips),
    has(getPodcasts(), last.podcasts),
    has(getWritingPrompts(), last.writing),
    has(getSpeakingTopics(), last.topicSpeaking),
  ]);
  last = { course, videoClips, podcasts, writing, topicSpeaking };
  return last;
}
