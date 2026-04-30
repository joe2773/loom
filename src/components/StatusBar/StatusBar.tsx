import styles from './StatusBar.module.css';

interface Props {
  message: string;
}

export function StatusBar({ message }: Props) {
  return (
    <div id="status-bar" className={styles.bar}>
      <span id="status-text" className={styles.text}>
        {message}
      </span>
    </div>
  );
}
