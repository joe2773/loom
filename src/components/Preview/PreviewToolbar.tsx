import styles from './PreviewContainer.module.css';

interface Props {
  hasRegion: boolean;
  canRecord: boolean;
  onClearRegion: () => void;
  onRecord: () => void;
}

export function PreviewToolbar({ hasRegion, canRecord, onClearRegion, onRecord }: Props) {
  return (
    <div id="preview-toolbar" className={styles.toolbar}>
      <button
        id="btn-clear-region"
        className={styles.btnGhost}
        onClick={onClearRegion}
        disabled={!hasRegion}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Clear Region
      </button>
      <button
        id="btn-record"
        className={styles.btnRecord}
        onClick={onRecord}
        disabled={!canRecord}
      >
        <span className={styles.recordDot} />
        Start Recording
      </button>
    </div>
  );
}
