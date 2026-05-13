import { useCallback, useEffect, useRef, useState } from 'react';

import { Header } from './components/Header/Header';
import { SetupPanel } from './components/SetupPanel/SetupPanel';
import { PreviewContainer } from './components/Preview/PreviewContainer';
import { PreviewToolbar } from './components/Preview/PreviewToolbar';
import { RecordingPill } from './components/RecordingPill/RecordingPill';
import { Library } from './components/Library/Library';
import { StatusBar } from './components/StatusBar/StatusBar';

import { useTimer } from './hooks/useTimer';
import { useRegionSelector } from './hooks/useRegionSelector';
import { useLibrary } from './hooks/useLibrary';
import { useAuth } from './auth/AuthContext';

import { acquireStream, stopStream } from './services/display';
import { ScreenRecorder } from './services/recorder';
import { captureFrame } from './services/screenshot';
import { downloadBlob, downloadCanvasAsPng, generateFilename } from './services/downloader';
import { uploadToGCS } from './services/uploader';
import { UnauthenticatedError } from './services/apiClient';

import type { Phase } from './types';
import styles from './App.module.css';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

function mimeExt(mimeType: string): 'mp4' | 'webm' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm';
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [format, setFormat] = useState('video/webm');
  const [quality, setQuality] = useState('2500000');
  const [status, setStatus] = useState('Ready — select a source to get started');

  const videoRef = useRef<HTMLVideoElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<ScreenRecorder | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const timer = useTimer();
  const region = useRegionSelector();
  const library = useLibrary();
  const { token } = useAuth();

  const isActive = phase === 'recording' || phase === 'paused';

  const stopCropLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startCropLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = cropCanvasRef.current;
    const cropRect = region.cropRect;
    if (!video || !canvas || !cropRect) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const sx = Math.round(cropRect.x * vw);
    const sy = Math.round(cropRect.y * vh);
    const sw = Math.round(cropRect.width * vw);
    const sh = Math.round(cropRect.height * vh);

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!video || !ctx) return;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      rafIdRef.current = requestAnimationFrame(draw);
    }
    draw();
  }, [region.cropRect]);

  const resetToIdle = useCallback(() => {
    stopCropLoop();
    timer.stop();
    recorderRef.current = null;
    streamRef.current = null;
    region.clear();
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase('idle');
    setStatus('Ready — select a source to get started');
  }, [region, stopCropLoop, timer]);

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    stopCropLoop();
    timer.stop();

    const blob = await recorder.stop();
    const ext = mimeExt(recorder.mimeType);
    const filename = generateFilename('video', ext);

    downloadBlob(blob, filename);
    const willUpload = Boolean(API_URL && token);
    setStatus(
      `Saved locally as .${ext}` +
        (willUpload ? ' — uploading…' : API_URL ? ' — sign in to upload' : ''),
    );

    recorderRef.current = null;
    setPhase('previewing');

    if (willUpload) {
      try {
        const publicUrl = await uploadToGCS(blob, filename);
        library.prepend(filename, publicUrl);
        setStatus(`Saved and uploaded: ${filename}`);
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          setStatus('Saved locally — sign in to upload');
        } else {
          const msg = err instanceof Error ? err.message : 'unknown';
          setStatus(`Saved locally — upload failed: ${msg}`);
        }
      }
    }
  }, [library, stopCropLoop, timer, token]);

  const onStreamEnded = useCallback(() => {
    if (phase === 'recording' || phase === 'paused') {
      setStatus('Source ended — saving recording…');
      finishRecording();
    } else {
      resetToIdle();
    }
  }, [phase, finishRecording, resetToIdle]);

  // Wire the track-ended handler whenever the stream changes
  const attachStreamEnded = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.addEventListener('ended', onStreamEnded);
  }, [onStreamEnded]);

  const handleSelectSource = useCallback(async () => {
    try {
      if (streamRef.current) stopStream(streamRef.current);
      const stream = await acquireStream({ audio: true });
      streamRef.current = stream;
      attachStreamEnded(stream);

      if (videoRef.current) videoRef.current.srcObject = stream;

      if (format === 'video/mp4' && !MediaRecorder.isTypeSupported('video/mp4')) {
        setFormat('video/webm');
        setStatus('MP4 not supported in this browser — switched to WebM');
      } else {
        setStatus('Source selected — ready to record');
      }

      setPhase('previewing');
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e.name !== 'NotAllowedError') {
        setStatus(`Error: ${e.message ?? 'unknown'}`);
      }
    }
  }, [attachStreamEnded, format]);

  const handleClearRegion = useCallback(() => {
    region.clear();
    setStatus('Region cleared — recording full source');
  }, [region]);

  // Status update when region changes
  useEffect(() => {
    if (region.cropRect) {
      const w = Math.round(region.cropRect.width * 100);
      const h = Math.round(region.cropRect.height * 100);
      setStatus(`Region selected — ${w}% × ${h}% of source`);
    }
  }, [region.cropRect]);

  const handleStartRecording = useCallback(() => {
    const stream = streamRef.current;
    const canvas = cropCanvasRef.current;
    if (!stream) return;

    const mimeType = format;
    const videoBitsPerSecond = parseInt(quality, 10);

    let recordStream: MediaStream = stream;
    if (region.cropRect && canvas) {
      startCropLoop();
      recordStream = canvas.captureStream(30);
    }

    const recorder = new ScreenRecorder(recordStream, { mimeType, videoBitsPerSecond });
    recorder.start();
    recorderRef.current = recorder;
    timer.start();
    setPhase('recording');
    setStatus('Recording…');
  }, [format, quality, region.cropRect, startCropLoop, timer]);

  const handlePauseToggle = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (phase === 'recording') {
      recorder.pause();
      timer.pause();
      setPhase('paused');
      setStatus('Paused');
    } else if (phase === 'paused') {
      recorder.resume();
      timer.resume();
      setPhase('recording');
      setStatus('Recording…');
    }
  }, [phase, timer]);

  const handleStop = useCallback(() => {
    setStatus('Saving…');
    finishRecording();
  }, [finishRecording]);

  const handleScreenshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = captureFrame(video, region.cropRect);
    downloadCanvasAsPng(canvas, generateFilename('image', 'png'));
    setStatus('Screenshot saved');
  }, [region.cropRect]);

  // Cleanup on unmount
  useEffect(() => stopCropLoop, [stopCropLoop]);

  return (
    <div id="app" className={styles.app}>
      <Header />

      <main id="workspace" className={styles.workspace}>
        {phase === 'idle' ? (
          <SetupPanel
            format={format}
            quality={quality}
            formatLocked={false}
            sourceSelected={false}
            onFormatChange={setFormat}
            onQualityChange={setQuality}
            onSelectSource={handleSelectSource}
            onScreenshot={handleScreenshot}
          />
        ) : (
          <PreviewContainer
            ref={previewContainerRef}
            videoRef={videoRef}
            cropCanvasRef={cropCanvasRef}
            regionOverlayRef={region.overlayRef}
            selectionBoxRef={region.boxRef}
            regionActive={region.active}
          >
            {phase === 'previewing' && (
              <PreviewToolbar
                hasRegion={region.cropRect != null}
                canRecord={phase === 'previewing'}
                onClearRegion={handleClearRegion}
                onRecord={handleStartRecording}
              />
            )}
            {isActive && (
              <RecordingPill
                paused={phase === 'paused'}
                timerDisplay={timer.display}
                format={format}
                quality={quality}
                formatLocked
                onPauseToggle={handlePauseToggle}
                onStop={handleStop}
                onScreenshot={handleScreenshot}
                onFormatChange={setFormat}
                onQualityChange={setQuality}
              />
            )}
          </PreviewContainer>
        )}
      </main>

      {library.enabled && <Library videos={library.videos} />}

      <StatusBar message={status} />
    </div>
  );
}

