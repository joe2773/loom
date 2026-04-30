export type Phase = 'idle' | 'previewing' | 'recording' | 'paused';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoMeta {
  name: string;
  url: string;
  created?: string;
}

export interface RecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
}
