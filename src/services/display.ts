interface AcquireOptions {
  audio?: boolean;
}

export async function acquireStream({ audio = true }: AcquireOptions = {}): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' } as MediaTrackConstraints,
    audio,
  });
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}
