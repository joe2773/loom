import { TypeCard } from './TypeCard';
import { FormatControls } from './FormatControls';
import styles from './SetupPanel.module.css';

interface Props {
  format: string;
  quality: string;
  formatLocked: boolean;
  sourceSelected: boolean;
  onFormatChange: (v: string) => void;
  onQualityChange: (v: string) => void;
  onSelectSource: () => void;
  onScreenshot: () => void;
}

const ScreenIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const RegionIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2 2" />
  </svg>
);

const ShotIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export function SetupPanel({
  format,
  quality,
  formatLocked,
  sourceSelected,
  onFormatChange,
  onQualityChange,
  onSelectSource,
  onScreenshot,
}: Props) {
  return (
    <div id="setup-panel" className={styles.panel}>
      <div className={styles.card}>
        <h2 className={styles.heading}>What do you want to record?</h2>
        <p className={styles.subheading}>Choose your recording type to get started</p>

        <div className={styles.typeGrid}>
          <TypeCard
            id="btn-select-source"
            label="Screen"
            description="Record your full screen"
            icon={ScreenIcon}
            onClick={onSelectSource}
          />
          <TypeCard
            id="btn-region-mode"
            label="Region"
            description="Record a selected area"
            icon={RegionIcon}
            disabled
          />
          <TypeCard
            id="btn-screenshot"
            label="Screenshot"
            description="Capture a still image"
            icon={ShotIcon}
            disabled={!sourceSelected}
            onClick={onScreenshot}
          />
        </div>

        <FormatControls
          format={format}
          quality={quality}
          onFormatChange={onFormatChange}
          onQualityChange={onQualityChange}
          disabled={formatLocked}
          selectClassName="select"
        />
      </div>
    </div>
  );
}
