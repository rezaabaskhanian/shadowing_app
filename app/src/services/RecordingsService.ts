import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * ذخیره‌ی صداهای ضبط‌شده‌ی کاربر روی خودِ گوشی.
 *
 * فایل صوتی در پوشه‌ی اسناد اپ (`.../recordings/`) با یک نام معنی‌دار نگه
 * داشته می‌شود، و فهرست متادیتاها (اینکه هر فایل مال کدام صحنه و کدام جمله
 * است) در AsyncStorage نگه داشته می‌شود تا صفحه‌ی «ضبط‌های من» بتواند لیست
 * را بدون خواندن خود فایل‌های صوتی بسازد.
 */

export interface RecordingMeta {
  id: string;
  /** مسیر کامل فایل روی گوشی. */
  path: string;
  /** فقط نام فایل، برای نمایش به کاربر. */
  fileName: string;
  sceneId: string;
  sceneTitle: string;
  /** شماره‌ی جمله در صحنه (از ۱). */
  lineNumber: number;
  /** متن انگلیسی همان جمله، برای اینکه لیست قابل فهم باشد. */
  text: string;
  /** فرمت واقعی ضبط‌شده (`react-native-nitro-sound` روی هر دو پلتفرم m4a می‌دهد). */
  mimeType: string;
  /** میلی‌ثانیه‌ی زمان ضبط. */
  createdAt: number;
}

const DIR = `${RNFS.DocumentDirectoryPath}/recordings`;
const INDEX_KEY = 'my_recordings_index';

/**
 * `react-native-nitro-sound` از `stopRecorder()` یک URI به شکل `file://...`
 * برمی‌گرداند (هم روی اندروید هم iOS — مستقیم از Uri.fromFile/URL خودِ
 * سیستم‌عامل می‌آید)، نه یک مسیر خامِ فایل‌سیستم. اگر همین رشته را مستقیم
 * به `RNFS.moveFile` بدهیم، لایه‌ی native آن را به‌عنوان یک مسیرِ حرف‌به‌حرف
 * (یعنی پوشه‌ای به اسم literal "file:") می‌خواند، فایل را پیدا نمی‌کند، و
 * move همیشه شکست می‌خورد — یعنی ضبط هیچ‌وقت واقعاً ذخیره نمی‌شود، هرچند
 * خودِ ضبط‌شدن بی‌مشکل انجام شده. برای APIهای nitro-sound (پخش) دست‌نخورده
 * می‌ماند چون آن‌ها خودشان با Uri.parse این پیشوند را درست می‌فهمند؛ فقط
 * قبل از سپردنش به RNFS باید پیشوند را برداریم.
 */
const toFsPath = (value: string) => (value.startsWith('file://') ? value.slice('file://'.length) : value);

/** نام صحنه را به یک قطعه‌ی امن برای نام فایل تبدیل می‌کند. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'scene';

/** `20260814-1532` — تا فایل‌ها هم مرتب باشند هم نامشان یکتا. */
const timestampLabel = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
};

const readIndex = async (): Promise<RecordingMeta[]> => {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as RecordingMeta[]) : [];
  } catch {
    return [];
  }
};

const writeIndex = (items: RecordingMeta[]) =>
  AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items)).catch(() => {});

/**
 * فایل موقتی که `react-native-nitro-sound` نوشته را به مسیر نهایی (با نام
 * معنی‌دار) منتقل می‌کند و متادیتای آن را برمی‌گرداند.
 *
 * برخلاف نسخه‌ی قبلی (که یک دیتا-یو‌آر‌ال را base64-decode می‌کرد)، اینجا
 * فقط یک `moveFile` ساده لازم است چون ضبط از همان ابتدا مستقیم روی دیسک
 * نوشته شده.
 */
export const saveRecording = async (params: {
  /** مسیر موقتی که `Sound.stopRecorder()` برگردانده. */
  sourcePath: string;
  sceneId: string;
  sceneTitle: string;
  lineNumber: number;
  text: string;
  mimeType?: string;
}): Promise<RecordingMeta> => {
  if (!(await RNFS.exists(DIR))) {
    await RNFS.mkdir(DIR);
  }

  const sourcePath = toFsPath(params.sourcePath);

  const createdAt = Date.now();
  const ext = sourcePath.split('.').pop() || 'm4a';
  // مثال: `coffee-shop_line-03_20260814-153207.m4a`
  const fileName =
    `${slugify(params.sceneTitle)}_line-${String(params.lineNumber).padStart(2, '0')}` +
    `_${timestampLabel(new Date(createdAt))}.${ext}`;
  const path = `${DIR}/${fileName}`;

  await RNFS.moveFile(sourcePath, path);

  const meta: RecordingMeta = {
    id: `${createdAt}`,
    path,
    fileName,
    sceneId: params.sceneId,
    sceneTitle: params.sceneTitle,
    lineNumber: params.lineNumber,
    text: params.text,
    mimeType: params.mimeType || 'audio/m4a',
    createdAt,
  };

  const index = await readIndex();
  await writeIndex([meta, ...index]);
  return meta;
};

/** همه‌ی ضبط‌ها (تازه‌ترین اول)؛ با `sceneId` فقط ضبط‌های یک صحنه. */
export const listRecordings = async (sceneId?: string): Promise<RecordingMeta[]> => {
  const index = await readIndex();
  return sceneId ? index.filter((item) => item.sceneId === sceneId) : index;
};

export const deleteRecording = async (id: string): Promise<void> => {
  const index = await readIndex();
  const target = index.find((item) => item.id === id);
  if (target) {
    await RNFS.unlink(target.path).catch(() => {});
  }
  await writeIndex(index.filter((item) => item.id !== id));
};
