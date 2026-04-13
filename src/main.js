import { acquireStream, stopStream } from './display.js';
import { ScreenRecorder } from './recorder.js';
import { RegionSelector } from './region.js';
import { captureFrame } from './screenshot.js';
import { RecordingTimer } from './timer.js';
import { downloadBlob, downloadCanvasAsPng, generateFilename } from './downloader.js';

// ─── DOM refs ────────────────────────────────────────────────────────────────
const video        = document.getElementById('preview');
const cropCanvas   = document.getElementById('crop-canvas');
const regionOverlay = document.getElementById('region-overlay');
const selectionBox = document.getElementById('selection-box');
const placeholder  = document.getElementById('preview-placeholder');
const timerEl      = document.getElementById('timer');
const statusEl     = document.getElementById('status-text');

const btnSource    = document.getElementById('btn-select-source');
const btnRegion    = document.getElementById('btn-region-mode');
const btnClear     = document.getElementById('btn-clear-region');
const btnRecord    = document.getElementById('btn-record');
const btnPause     = document.getElementById('btn-pause');
const btnStop      = document.getElementById('btn-stop');
const btnShot      = document.getElementById('btn-screenshot');

const fmtSelect    = document.getElementById('select-format');
const qualSelect   = document.getElementById('select-quality');

// ─── App state ───────────────────────────────────────────────────────────────
const state = {
  phase: 'idle',       // 'idle' | 'previewing' | 'recording' | 'paused'
  stream: null,
  recorder: null,
  timer: new RecordingTimer(timerEl),
  regionSelector: null,
  cropRect: null,
  rafId: null,
};

// ─── Region selector setup ───────────────────────────────────────────────────
state.regionSelector = new RegionSelector(
  regionOverlay,
  selectionBox,
  video,
  (rect) => {
    state.cropRect = rect;
    if (rect) {
      setStatus(`Region selected — ${Math.round(rect.width * 100)}% × ${Math.round(rect.height * 100)}% of source`);
      btnClear.disabled = false;
    } else {
      setStatus('Region cleared — recording full source');
      btnClear.disabled = true;
      selectionBox.style.display = 'none';
    }
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setStatus(msg) {
  statusEl.textContent = msg;
}

function setPhase(phase) {
  state.phase = phase;

  const isPreviewing = phase === 'previewing';
  const isRecording  = phase === 'recording';
  const isPaused     = phase === 'paused';
  const isActive     = isRecording || isPaused;

  btnSource.disabled    = isActive;
  btnRegion.disabled    = !isPreviewing;
  btnRecord.disabled    = !isPreviewing;
  btnPause.disabled     = !isActive;
  btnStop.disabled      = !isActive;
  btnShot.disabled      = phase === 'idle';
  fmtSelect.disabled    = isActive;
  qualSelect.disabled   = isActive;

  btnPause.textContent  = isPaused ? 'Resume' : 'Pause';
  timerEl.classList.toggle('recording', isRecording);
  timerEl.classList.toggle('paused', isPaused);
}

function mimeExt(mimeType) {
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

/** Start the rAF loop that draws cropped frames into cropCanvas. */
function startCropLoop(cropRect) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const sx = Math.round(cropRect.x * vw);
  const sy = Math.round(cropRect.y * vh);
  const sw = Math.round(cropRect.width * vw);
  const sh = Math.round(cropRect.height * vh);

  cropCanvas.width  = sw;
  cropCanvas.height = sh;
  const ctx = cropCanvas.getContext('2d');

  function draw() {
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    state.rafId = requestAnimationFrame(draw);
  }
  draw();
}

function stopCropLoop() {
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

async function stopRecording() {
  stopCropLoop();
  state.timer.stop();

  const blob = await state.recorder.stop();
  const ext  = mimeExt(state.recorder.mimeType);
  downloadBlob(blob, generateFilename('video', ext));
  setStatus(`Saved recording as .${ext}`);

  state.recorder = null;
  setPhase('previewing');
}

// ─── Stream ended (user closed the browser picker) ───────────────────────────
function onStreamEnded() {
  if (state.phase === 'recording' || state.phase === 'paused') {
    setStatus('Source ended — saving recording…');
    stopRecording();
  } else {
    resetToIdle();
  }
}

function resetToIdle() {
  stopCropLoop();
  state.timer.stop();
  state.recorder = null;
  state.stream   = null;
  state.cropRect = null;
  selectionBox.style.display = 'none';
  video.srcObject = null;
  placeholder.style.display = 'flex';
  setPhase('idle');
  setStatus('Ready — select a source to get started');
}

// ─── Button handlers ─────────────────────────────────────────────────────────
btnSource.addEventListener('click', async () => {
  try {
    if (state.stream) stopStream(state.stream);
    state.stream = await acquireStream({ audio: true });

    // Watch for the user closing the picker / stopping share
    state.stream.getVideoTracks()[0].addEventListener('ended', onStreamEnded);

    video.srcObject = state.stream;
    placeholder.style.display = 'none';

    // Warn if mp4 isn't supported and swap to webm
    if (fmtSelect.value === 'video/mp4' && !MediaRecorder.isTypeSupported('video/mp4')) {
      fmtSelect.value = 'video/webm';
      setStatus('MP4 not supported in this browser — switched to WebM');
    } else {
      setStatus('Source selected — ready to record');
    }

    setPhase('previewing');
  } catch (err) {
    if (err.name !== 'NotAllowedError') {
      setStatus(`Error: ${err.message}`);
    }
  }
});

btnRegion.addEventListener('click', () => {
  setStatus('Drag to select a region, or click to cancel');
  state.regionSelector.activate();
});

btnClear.addEventListener('click', () => {
  state.regionSelector.clearSelection();
  btnClear.disabled = true;
});

btnRecord.addEventListener('click', () => {
  const mimeType = fmtSelect.value;
  const videoBitsPerSecond = parseInt(qualSelect.value, 10);

  let recordStream = state.stream;
  if (state.cropRect) {
    startCropLoop(state.cropRect);
    recordStream = cropCanvas.captureStream(30);
  }

  state.recorder = new ScreenRecorder(recordStream, { mimeType, videoBitsPerSecond });
  state.recorder.start();
  state.timer.start();
  setPhase('recording');
  setStatus('Recording…');
});

btnPause.addEventListener('click', () => {
  if (state.phase === 'recording') {
    state.recorder.pause();
    state.timer.pause();
    setPhase('paused');
    setStatus('Paused');
  } else if (state.phase === 'paused') {
    state.recorder.resume();
    state.timer.resume();
    setPhase('recording');
    setStatus('Recording…');
  }
});

btnStop.addEventListener('click', () => {
  setStatus('Saving…');
  stopRecording();
});

btnShot.addEventListener('click', () => {
  const canvas = captureFrame(video, state.cropRect);
  downloadCanvasAsPng(canvas, generateFilename('image', 'png'));
  setStatus('Screenshot saved');
});

// ─── Init ─────────────────────────────────────────────────────────────────────
setPhase('idle');
