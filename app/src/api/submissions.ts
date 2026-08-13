import { authFetch, jsonOrThrow } from './client';

export interface DialogueLineInput {
  speaker: string;
  text: string;
}

export interface SceneSubmission {
  id: string;
  user_id: string;
  image_url: string;
  situation_text: string;
  dialogues: DialogueLineInput[] | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  points_awarded: number | null;
  scene_id: string;
  created_at: string;
}

export async function uploadSubmissionImage(uri: string, fileName: string, mimeType: string): Promise<string> {
  const fd = new FormData();
  fd.append('image', { uri, name: fileName, type: mimeType } as unknown as Blob);

  const res = await authFetch('/v1/learning/upload-image', { method: 'POST', body: fd });
  const data = await jsonOrThrow(res);
  return data.url as string;
}

export async function createSceneSubmission(
  situationText: string,
  dialogues: DialogueLineInput[],
  imageUrl?: string
): Promise<SceneSubmission> {
  const res = await authFetch('/v1/learning/scene-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      situation_text: situationText,
      dialogues,
      image_url: imageUrl || '',
    }),
  });
  return jsonOrThrow(res) as Promise<SceneSubmission>;
}

export async function listMySceneSubmissions(): Promise<SceneSubmission[]> {
  const res = await authFetch('/v1/learning/scene-submissions/mine', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.submissions || []) as SceneSubmission[];
}

export async function getMyPoints(): Promise<number> {
  const res = await authFetch('/v1/learning/points', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.points as number) || 0;
}
