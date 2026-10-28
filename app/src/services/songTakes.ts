import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';

import { mixTake } from '../api/songs';

/**
 * «ضبط‌های من» از بخش آهنگ: هر بار که کاربر با آهنگ می‌خواند، ضبطش با زمانِ شروع
 * در آهنگ و طولش در گوشی می‌ماند (نه روی سرور). ذخیره در گوشی = ترکیب با موزیک
 * روی سرور و نوشتن mp3 در پوشه‌ی Music/LingoFlow.
 */
export interface SongTake {
  id: string;
  songId: string;
  title: string;
  artist: string;
  coverUrl: string;
  /** فایل m4a صدای کاربر داخل پوشه‌ی اپ. */
  path: string;
  /** لحظه‌ای از آهنگ (ms) که ضبط از آن شروع شد. */
  offsetMs: number;
  durationMs: number;
  createdAt: number;
  /** مسیر mp3 ذخیره‌شده در گوشی، اگر ذخیره شده باشد. */
  exportedPath?: string;
}

const KEY = 'song_takes_v1';
const DIR = `${RNFS.DocumentDirectoryPath}/song_takes`;

async function readAll(): Promise<SongTake[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SongTake[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: SongTake[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

/** جدیدترین اول؛ ضبط‌هایی که فایلشان پاک شده کنار گذاشته می‌شوند. */
export async function listTakes(): Promise<SongTake[]> {
  const all = await readAll();
  const alive: SongTake[] = [];
  for (const t of all) {
    if (await RNFS.exists(t.path).catch(() => false)) alive.push(t);
  }
  if (alive.length !== all.length) await writeAll(alive);
  return alive.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getTake(id: string): Promise<SongTake | undefined> {
  return (await readAll()).find((t) => t.id === id);
}

/** فایل ضبط موقت را به پوشه‌ی ضبط‌ها منتقل و در لیست ثبت می‌کند. */
export async function addTake(
  tempPath: string,
  meta: Omit<SongTake, 'id' | 'path' | 'createdAt' | 'exportedPath'>,
): Promise<SongTake> {
  await RNFS.mkdir(DIR).catch(() => {});
  const id = `${meta.songId}_${Date.now()}`;
  const path = `${DIR}/${id}.m4a`;
  const src = tempPath.replace(/^file:\/\//, '');
  await RNFS.moveFile(src, path).catch(() => RNFS.copyFile(src, path));
  const take: SongTake = { ...meta, id, path, createdAt: Date.now() };
  await writeAll([take, ...(await readAll())]);
  return take;
}

export async function deleteTake(id: string): Promise<void> {
  const all = await readAll();
  const t = all.find((x) => x.id === id);
  if (t) await RNFS.unlink(t.path).catch(() => {});
  await writeAll(all.filter((x) => x.id !== id));
}

async function ensureWritePermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version) >= 29) return true;
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

const safeName = (s: string) => s.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '_') || 'song';

/**
 * صدای کاربر + موزیک را یک mp3 می‌کند و در Music/LingoFlow گوشی می‌نویسد تا در
 * برنامه‌ی موزیک و فایل‌منیجر دیده شود. مسیر فایل را برمی‌گرداند.
 */
export async function exportTake(take: SongTake): Promise<string> {
  if (!(await ensureWritePermission())) throw new Error('permission');
  const b64 = await mixTake({
    songId: take.songId,
    filePath: take.path,
    offsetMs: take.offsetMs,
    durationMs: take.durationMs,
  });
  const dir = `${RNFS.ExternalStorageDirectoryPath}/Music/LingoFlow`;
  await RNFS.mkdir(dir).catch(() => {});
  const d = new Date(take.createdAt);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  const out = `${dir}/${safeName(take.title)}_${stamp}.mp3`;
  await RNFS.writeFile(out, b64, 'base64');
  await RNFS.scanFile(out).catch(() => null);
  const all = await readAll();
  await writeAll(all.map((x) => (x.id === take.id ? { ...x, exportedPath: out } : x)));
  return out;
}
