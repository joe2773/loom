import styles from './RecordingPill.module.css';

interface Props {
  display: string;
  paused: boolean;
}

export function Timer({ display, paused }: Props) {
  return (
    <div className={`${styles.status} ${paused ? styles.paused : ''}`.trim()}>
      <span className={styles.dot} />
      <span id="timer" className={styles.timer}>
        {display}
      </span>
    </div>
  );
}
