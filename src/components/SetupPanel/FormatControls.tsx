import styles from './SetupPanel.module.css';

interface Props {
  format: string;
  quality: string;
  onFormatChange: (v: string) => void;
  onQualityChange: (v: string) => void;
  disabled?: boolean;
  formatId?: string;
  qualityId?: string;
  selectClassName?: string;
}

export function FormatControls({
  format,
  quality,
  onFormatChange,
  onQualityChange,
  disabled,
  formatId = 'select-format',
  qualityId = 'select-quality',
  selectClassName,
}: Props) {
  return (
    <div id="format-controls" className={styles.formatControls}>
      <div className={styles.formatGroup}>
        <label htmlFor={formatId}>Format</label>
        <select
          id={formatId}
          className={selectClassName}
          value={format}
          disabled={disabled}
          onChange={(e) => onFormatChange(e.target.value)}
        >
          <option value="video/webm">WebM</option>
          <option value="video/mp4">MP4</option>
        </select>
      </div>
      <div className={styles.formatGroup}>
        <label htmlFor={qualityId}>Quality</label>
        <select
          id={qualityId}
          className={selectClassName}
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
  );
}
