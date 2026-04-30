import type { VideoMeta } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export async function listVideos(): Promise<VideoMeta[]> {
  if (!API_URL) return [];
  const res = await fetch(`${API_URL}/videos`);
  if (!res.ok) throw new Error(`Failed to load videos: ${res.status}`);
  return (await res.json()) as VideoMeta[];
}
