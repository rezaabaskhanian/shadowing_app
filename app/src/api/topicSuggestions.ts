import { authFetch, jsonOrThrow } from './client';

export interface TopicSuggestion {
  id: string;
  topic_text: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
}

export async function createTopicSuggestion(topicText: string): Promise<TopicSuggestion> {
  const res = await authFetch('/v1/learning/topic-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic_text: topicText }),
  });
  return (await jsonOrThrow(res)) as TopicSuggestion;
}

export async function listMyTopicSuggestions(): Promise<TopicSuggestion[]> {
  const res = await authFetch('/v1/learning/topic-suggestions/mine', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.suggestions || []) as TopicSuggestion[];
}
