import type { VideoMeta } from '../types';
import { apiFetch, getApiUrl, getStoredToken } from './apiClient';

export async function listVideos(): Promise<VideoMeta[]> {
  if (!getApiUrl() || !getStoredToken()) return [];
  const res = await apiFetch('/videos');
  if (!res.ok) throw new Error(`Failed to load videos: ${res.status}`);
  return (await res.json()) as VideoMeta[];
}
