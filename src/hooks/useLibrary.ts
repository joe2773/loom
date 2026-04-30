import { useCallback, useEffect, useState } from 'react';
import { listVideos } from '../services/library';
import type { VideoMeta } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export interface LibraryControls {
  videos: VideoMeta[];
  enabled: boolean;
  prepend: (name: string, url: string) => void;
  error: string | null;
}

export function useLibrary(): LibraryControls {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const enabled = Boolean(API_URL);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    listVideos()
      .then((list) => {
        if (!cancelled) setVideos(list);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const prepend = useCallback((name: string, url: string) => {
    setVideos((prev) => [{ name, url, created: new Date().toISOString() }, ...prev]);
  }, []);

  return { videos, enabled, prepend, error };
}
