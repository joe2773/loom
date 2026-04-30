import { useRef, useState } from 'react';
import { Timer } from './Timer';
import { PillButton } from './PillButton';
import { GearPanel } from './GearPanel';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './RecordingPill.module.css';

interface Props {
  paused: boolean;
  timerDisplay: string;
  format: string;
  quality: string;
  formatLocked: boolean;
  onPauseToggle: () => void;
  onStop: () => void;
  onScreenshot: () => void;
  onFormatChange: (v: string) => void;
  onQualityChange: (v: string) => void;
}

const PauseIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const ResumeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const StopIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const ShotIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const GearIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function RecordingPill({
  paused,
  timerDisplay,
  format,
  quality,
  formatLocked,
  onPauseToggle,
  onStop,
  onScreenshot,
  onFormatChange,
  onQualityChange,
}: Props) {
  const [gearOpen, setGearOpen] = useState(false);
  const gearPanelRef = useRef<HTMLDivElement>(null);
  const gearBtnRef = useRef<HTMLButtonElement>(null);

  useClickOutside([gearPanelRef, gearBtnRef], gearOpen, () => setGearOpen(false));

  return (
    <div id="recording-pill" className={`${styles.pill} ${paused ? styles.paused : ''}`.trim()}>
      {gearOpen && (
        <GearPanel
          ref={gearPanelRef}
          format={format}
          quality={quality}
          disabled={formatLocked}
          onFormatChange={onFormatChange}
          onQualityChange={onQualityChange}
        />
      )}

      <div className={styles.inner}>
        <Timer display={timerDisplay} paused={paused} />

        <div className={styles.divider} />

        <PillButton
          id="btn-pause"
          aria-label={paused ? 'Resume recording' : 'Pause recording'}
          onClick={onPauseToggle}
        >
          <span id="icon-pause" style={{ display: paused ? 'none' : 'inline-flex' }}>
            {PauseIcon}
          </span>
          <span id="icon-resume" style={{ display: paused ? 'inline-flex' : 'none' }}>
            {ResumeIcon}
          </span>
        </PillButton>

        <PillButton id="btn-stop" aria-label="Stop recording" onClick={onStop}>
          {StopIcon}
        </PillButton>

        <PillButton id="btn-screenshot-pill" aria-label="Take screenshot" onClick={onScreenshot}>
          {ShotIcon}
        </PillButton>

        <div className={styles.divider} />

        <PillButton
          id="btn-gear"
          aria-label="Settings"
          ref={gearBtnRef}
          onClick={(e) => {
            e.stopPropagation();
            setGearOpen((v) => !v);
          }}
        >
          {GearIcon}
        </PillButton>
      </div>
    </div>
  );
}
