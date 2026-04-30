import { forwardRef } from 'react';
import styles from './RecordingPill.module.css';

interface Props {
  format: string;
  quality: string;
  disabled: boolean;
  onFormatChange: (v: string) => void;
  onQualityChange: (v: string) => void;
}

export const GearPanel = forwardRef<HTMLDivElement, Props>(
  ({ format, quality, disabled, onFormatChange, onQualityChange }, ref) => (
    <div id="gear-panel" ref={ref} className={styles.gearPanel}>
      <div className={styles.gearRow}>
        <label htmlFor="select-format-pill">Format</label>
        <select
          id="select-format-pill"
          className={styles.selectDark}
          value={format}
          disabled={disabled}
          onChange={(e) => onFormatChange(e.target.value)}
        >
          <option value="video/webm">WebM</option>
          <option value="video/mp4">MP4</option>
        </select>
      </div>
      <div className={styles.gearRow}>
        <label htmlFor="select-quality-pill">Quality</label>
        <select
          id="select-quality-pill"
          className={styles.selectDark}
          value={quality}
          disabled={disabled}
          onChange={(e) => onQualityChange(e.target.value)}
        >
          <option value="2500000">High</option>
          <option value="1000000">Medium</option>
          <option value="500000">Low</option>
        </select>
      </div>
    </div>
  ),
);
GearPanel.displayName = 'GearPanel';
