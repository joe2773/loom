# Loom — Screen Recorder

A lightweight, browser-based screen recording tool. Capture your entire screen, a specific region, or take screenshots — all without a backend. Recordings and screenshots are automatically saved to your Downloads folder.

## Features

- 🎬 **Screen Recording** — record your full screen or select a window/tab
- 🎯 **Region Selection** — drag to select a specific area to record
- 📸 **Screenshot** — capture still images of your screen or selected region
- ⏸️ **Pause/Resume** — control your recording with play/pause
- 📥 **Auto-Download** — files save directly to Downloads on stop
- 🎨 **Modern UI** — Loom-inspired design with dark recording pill and setup card

## Tech Stack

- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **Build Tool**: Vite
- **Testing**: Vitest + jsdom
- **APIs**: `getDisplayMedia`, `MediaRecorder`, Canvas 2D

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
git clone https://github.com/joe2773/loom.git
cd loom
npm install
```

## Development

### Run the Dev Server

```bash
npm run dev
```

Opens the app at `http://localhost:5173`. Hot module reload is enabled — changes appear instantly.

### Build for Production

```bash
npm run build
```

Creates an optimized static bundle in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally to verify it works.

## Testing

### Run All Tests

```bash
npm test
```

Runs the full test suite once (64 passing tests).

### Watch Mode

```bash
npm run test:watch
```

Re-runs tests automatically whenever you edit a file. Great for TDD.

### Test Coverage

- **42 unit tests** — individual modules (recorder, timer, region selector, etc.)
- **22 integration tests** — app state machine and feature flows

Tests use mocked browser APIs (MediaRecorder, getDisplayMedia, Canvas) so they run headlessly without user interaction.

## How to Use

1. Open the app in your browser
2. Click **"Screen"** to select your recording source (browser will show a native picker)
3. **(Optional)** Click **"Region"** and drag to select an area to record
4. Click **"Start Recording"** to begin
5. Click **"Pause"** to pause, or **"Resume"** to continue
6. Click **"Stop"** to finish — the `.webm` file downloads automatically
7. Alternatively, click **"Screenshot"** to capture a still image (`.png`)

## Project Structure

```
loom/
├── index.html              # Main HTML shell
├── src/
│   ├── main.js            # App state machine & event handlers
│   ├── display.js         # Screen capture (getDisplayMedia)
│   ├── recorder.js        # MediaRecorder wrapper
│   ├── region.js          # Drag-to-select region overlay
│   ├── screenshot.js      # Canvas frame capture
│   ├── timer.js           # Recording duration tracker
│   ├── downloader.js      # File download utilities
│   └── style.css          # Loom-inspired dark UI
├── tests/
│   ├── setup.js           # Shared mock factories & global setup
│   ├── unit/              # Unit tests (recorder, timer, region, etc.)
│   └── integration/       # Integration tests (state machine)
├── package.json
├── vite.config.js
└── README.md
```

## Browser Support

Works in modern Chromium browsers (Chrome, Edge, Brave, etc.) that support:
- `navigator.mediaDevices.getDisplayMedia()`
- `MediaRecorder` API
- Canvas 2D context

Firefox and Safari have limited or no support for `getDisplayMedia()`.

## License

MIT
