import { authFetch, jsonOrThrow } from './client';

/**
 * «زبان تخصصی»: هر رشته فهرست لغت دارد و محتوای موجود (صحنه، پادکست، موضوع،
 * مصاحبه) برچسب آن رشته را می‌گیرد (بک‌اند: specialtyservice).
 */

export interface SpecialtyField {
  key: string;
  title_fa: string;
  title_en: string;
  icon: string;
  /** پایین‌ترین سطحی که رشته برایش باز است (پیش‌فرض intermediate = B1). */
  min_level: string;
  word_count: number;
}

export interface FieldWord {
  id: string;
  word: string;
  meaning_fa: string;
  example: string;
  example_fa: string;
  level: string;
  audio_url: string;
}

export type FieldContentKind = 'scene' | 'podcast' | 'speaking_topic' | 'writing_prompt' | 'interview';

export interface FieldContentItem {
  kind: FieldContentKind;
  id: string;
  title: string;
  level: string;
  image_url: string;
}

export interface SpecialtyFieldDetail extends SpecialtyField {
  words: FieldWord[];
  content: FieldContentItem[];
}

export async function getSpecialtyFields(): Promise<SpecialtyField[]> {
  const res = await authFetch('/v1/specialty/fields', { method: 'GET' });
  return ((await jsonOrThrow(res)) as SpecialtyField[]) || [];
}

export async function getSpecialtyField(key: string): Promise<SpecialtyFieldDetail> {
  const res = await authFetch(`/v1/specialty/fields/${encodeURIComponent(key)}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as SpecialtyFieldDetail;
}
