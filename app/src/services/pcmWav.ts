import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * تبدیلِ تکه‌های PCM خامِ base64 (که Gemini Live می‌فرستد) به یک فایل WAV
 * قابل‌پخش با `react-native-nitro-sound` — همان پلیرِ فعلی اپ.
 *
 * چرا این‌طور: پخشِ استریمیِ واقعیِ PCM (بدون صبر برای کامل‌شدنِ نوبت) نیاز به
 * یک پلیرِ بافردار سطح‌پایین دارد که در پروژه هنوز نیست. برای اولین نسخه‌ی
 * PoC، صدای هر نوبت را کامل بافر می‌کنیم و بعد از turnComplete یک‌جا پخش
 * می‌کنیم — یعنی تاخیرِ کمی نسبت به استریمِ واقعی دارد، ولی نیازی به کتابخانه‌ی
 * جدید ندارد. اگر PoC کیفیتِ خوبی نشان داد، این بخش باید با یک پلیرِ استریمی
 * جایگزین شود.
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: number[]): string {
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += BASE64_CHARS[(chunk >> 18) & 63];
    result += BASE64_CHARS[(chunk >> 12) & 63];
    result += BASE64_CHARS[(chunk >> 6) & 63];
    result += BASE64_CHARS[chunk & 63];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    result += BASE64_CHARS[(chunk >> 18) & 63] + BASE64_CHARS[(chunk >> 12) & 63] + '==';
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result +=
      BASE64_CHARS[(chunk >> 18) & 63] +
      BASE64_CHARS[(chunk >> 12) & 63] +
      BASE64_CHARS[(chunk >> 6) & 63] +
      '=';
  }
  return result;
}

/** طولِ بایتِ واقعی (decode-شده) یک رشته‌ی base64، بدون نیاز به decode کامل. */
function base64DecodedByteLength(b64: string): number {
  const len = b64.length;
  if (len === 0) return 0;
  let padding = 0;
  if (b64.endsWith('==')) padding = 2;
  else if (b64.endsWith('=')) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

function pushUint32LE(arr: number[], value: number) {
  arr.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

function pushUint16LE(arr: number[], value: number) {
  arr.push(value & 0xff, (value >> 8) & 0xff);
}

function pushAscii(arr: number[], text: string) {
  for (let i = 0; i < text.length; i++) arr.push(text.charCodeAt(i));
}

function buildWavHeaderBase64(dataSize: number, sampleRate: number, channels: number, bitsPerSample: number): string {
  const bytes: number[] = [];
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  pushAscii(bytes, 'RIFF');
  pushUint32LE(bytes, 36 + dataSize);
  pushAscii(bytes, 'WAVE');
  pushAscii(bytes, 'fmt ');
  pushUint32LE(bytes, 16);
  pushUint16LE(bytes, 1); // PCM
  pushUint16LE(bytes, channels);
  pushUint32LE(bytes, sampleRate);
  pushUint32LE(bytes, byteRate);
  pushUint16LE(bytes, blockAlign);
  pushUint16LE(bytes, bitsPerSample);
  pushAscii(bytes, 'data');
  pushUint32LE(bytes, dataSize);

  return bytesToBase64(bytes);
}

/**
 * تکه‌های base64 PCM16 (ترتیب‌شان مهم است) را به یک فایل WAV در
 * `RNFS.CachesDirectoryPath` می‌نویسد و مسیر `file://...` را برمی‌گرداند.
 */
export async function pcmChunksToWavFile(
  chunks: string[],
  opts: { sampleRate?: number; channels?: number; bitsPerSample?: number } = {}
): Promise<string> {
  const sampleRate = opts.sampleRate ?? 24000;
  const channels = opts.channels ?? 1;
  const bitsPerSample = opts.bitsPerSample ?? 16;

  const dataSize = chunks.reduce((sum, c) => sum + base64DecodedByteLength(c), 0);
  const path = `${RNFS.CachesDirectoryPath}/gemini-live-poc-${Date.now()}.wav`;

  const headerB64 = buildWavHeaderBase64(dataSize, sampleRate, channels, bitsPerSample);
  await RNFS.writeFile(path, headerB64, 'base64');
  for (const chunk of chunks) {
    if (!chunk) continue;
    await RNFS.appendFile(path, chunk, 'base64');
  }

  return `file://${path}`;
}
