import { authFetch } from './client';
import type { Scenario } from '../data/scenarios';
import { absUrl } from './config';

export interface GenerateCustomSceneParams {
  topic?: string;
  text?: string;
  difficulty?: string;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
}

export async function generateCustomScene(params: GenerateCustomSceneParams): Promise<any> {
  let res: Response;

  if (params.file) {
    const formData = new FormData();
    if (params.topic) formData.append('topic', params.topic);
    if (params.text) formData.append('text', params.text);
    if (params.difficulty) formData.append('difficulty', params.difficulty);

    formData.append('file', {
      uri: params.file.uri,
      name: params.file.name,
      type: params.file.type,
    } as any);

    res = await authFetch('/v1/learning/custom-scenes/generate', {
      method: 'POST',
      body: formData,
    });
  } else {
    res = await authFetch('/v1/learning/custom-scenes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: params.topic || '',
        text: params.text || '',
        difficulty: params.difficulty || 'Intermediate',
      }),
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'خطا در ساخت صحنه اختصاصی');
  }

  return res.json();
}

export async function fetchUserCustomScenes(): Promise<Scenario[]> {
  const res = await authFetch('/v1/learning/custom-scenes', {
    method: 'GET',
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json().catch(() => ({ scenes: [] }));
  const rawList = data.scenes || [];

  return rawList.map((sc: any) => ({
    id: sc.id,
    title: sc.title,
    lesson: sc.description || 'صحنه اختصاصی شما',
    level: sc.difficulty || 'Intermediate',
    progress: 0,
    time: '5 min',
    icon: null,
    color: '#F59E0B',
    imageUri: sc.background_image_url ? absUrl(sc.background_image_url) : null,
    hotspots: [],
    sentencesCount: 6,
    isCompleted: false,
    category: 'custom',
  }));
}

export async function deleteUserCustomScene(sceneId: string): Promise<boolean> {
  const res = await authFetch(`/v1/learning/custom-scenes/${sceneId}`, {
    method: 'DELETE',
  });
  return res.ok;
}

