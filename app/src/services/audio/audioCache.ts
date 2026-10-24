import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * کش صدای جمله‌ها روی گوشی.
 *
 * هر جمله‌ی صحنه یک mp3 جداست و روی اینترنت کند، دانلودِ هر کدام لحظه‌ی پخش
 * تأخیر محسوس می‌انداخت. وقتی صحنه باز می‌شود همه‌ی صداهایش پشت صحنه دانلود
 * می‌شوند و پخش از `file://` انجام می‌شود. اسم فایل از خودِ URL ساخته می‌شود
 * (فایل‌های سرور uuid دارند و عوض نمی‌شوند)، پس کش هیچ‌وقت صدای کهنه نمی‌دهد.
 */
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/line-audio-v2`;
const MAX_BYTES = 100 * 1024 * 1024; // ۱۰۰ مگابایت؛ هر صحنه کمتر از ۱ مگابایت است
const PARALLEL = 3;

/** url → مسیر فایلِ کامل‌شده؛ فقط فایل‌هایی که دانلودشان تمام شده اینجا هستند. */
const ready = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();
let dirReady: Promise<void> | null = null;

function ensureDir(): Promise<void> {
  if (!dirReady) {
    dirReady = RNFS.mkdir(CACHE_DIR).catch(() => undefined);
  }
  return dirReady;
}

function fileNameFor(url: string): string {
  const clean = url.split('?')[0];
  const ext = (clean.match(/\.(mp3|m4a|wav|aac|ogg)$/i)?.[1] || 'mp3').toLowerCase();
  // URLهای سرور از قبل یکتا هستند؛ کاراکترهای غیرمجاز اسم فایل را با _ عوض می‌کنیم.
  const base = clean.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '_').slice(-120);
  return `${base}.${ext}`;
}

const isRemote = (url: string) => /^https?:\/\//i.test(url);

/**
 * مسیر محلیِ صدا اگر کامل دانلود شده باشد، وگرنه خودِ URL. همگام است تا
 * پخش‌کننده منتظر هیچ چیزی نماند؛ اگر هنوز در کش نیست، همان لحظه دانلودش را
 * پشت صحنه شروع می‌کند تا دفعه‌ی بعد آماده باشد.
 */
export function getCachedAudio(url: string): string {
  if (!isRemote(url)) return url;
  const local = ready.get(url);
  if (local) return `file://${local}`;
  download(url);
  return url;
}

export interface PrefetchProgress {
  done: number;
  total: number;
  failed: number;
}

/**
 * همه‌ی صداهای یک صحنه را دانلود می‌کند (حداکثر چند تا هم‌زمان). onProgress
 * بعد از هر فایل صدا زده می‌شود تا صفحه بتواند تا آماده شدن صداها منتظر بماند.
 */
export async function prefetchAudio(
  urls: (string | null | undefined)[],
  onProgress?: (p: PrefetchProgress) => void
): Promise<PrefetchProgress> {
  const queue = Array.from(new Set(urls.filter((u): u is string => !!u && isRemote(u))));
  const progress: PrefetchProgress = { done: 0, total: queue.length, failed: 0 };
  onProgress?.({ ...progress });
  const workers = Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) continue;
      const path = await download(next);
      progress.done += 1;
      if (!path) progress.failed += 1;
      onProgress?.({ ...progress });
    }
  });
  await Promise.all(workers);
  trimCache();
  return progress;
}

function download(url: string): Promise<string | null> {
  if (ready.has(url)) return Promise.resolve(ready.get(url)!);
  const existing = inFlight.get(url);
  if (existing) return existing;

  const job = (async () => {
    await ensureDir();
    const path = `${CACHE_DIR}/${fileNameFor(url)}`;
    try {
      if (await RNFS.exists(path)) {
        ready.set(url, path);
        return path;
      }
      // اول در فایل موقت می‌نویسیم و بعد جابه‌جا می‌کنیم، تا فایل نیمه‌کاره
      // (اگر اینترنت وسط کار قطع شد) هیچ‌وقت به‌جای صدای کامل پخش نشود.
      const tmp = `${path}.part`;
      // بدون سقف زمانی، روی اینترنت قطع‌ووصل یک فایل می‌توانست صفحه را تا ابد منتظر نگه دارد.
      const res = await RNFS.downloadFile({ fromUrl: url, toFile: tmp, connectionTimeout: 15000, readTimeout: 20000 }).promise;
      if (res.statusCode < 200 || res.statusCode >= 300) {
        await RNFS.unlink(tmp).catch(() => undefined);
        return null;
      }
      await RNFS.moveFile(tmp, path);
      ready.set(url, path);
      return path;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();
  inFlight.set(url, job);
  return job;
}

/** اگر کش از سقف بیشتر شد، قدیمی‌ترین فایل‌ها پاک می‌شوند. */
async function trimCache(): Promise<void> {
  try {
    const files = (await RNFS.readDir(CACHE_DIR)).filter((f) => f.isFile() && !f.name.endsWith('.part'));
    let total = files.reduce((sum, f) => sum + Number(f.size || 0), 0);
    if (total <= MAX_BYTES) return;
    files.sort((a, b) => (a.mtime?.getTime() ?? 0) - (b.mtime?.getTime() ?? 0));
    for (const f of files) {
      if (total <= MAX_BYTES * 0.8) break;
      await RNFS.unlink(f.path).catch(() => undefined);
      total -= Number(f.size || 0);
      for (const [u, p] of ready) if (p === f.path) ready.delete(u);
    }
  } catch {
    // کش فقط برای سرعت است؛ خطای پاک‌سازی نباید روی پخش اثری بگذارد.
  }
}
