import { LoginButton } from './LoginButton';
import styles from './Header.module.css';

export function Header() {
  return (
    <header id="header" className={styles.header}>
      <div className={styles.logo}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="28" height="28" rx="6" fill="#625DF5" />
          <path d="M14 8L19.5 11.5V18.5L14 22L8.5 18.5V11.5L14 8Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <circle cx="14" cy="15" r="3" fill="white" />
        </svg>
        <span className={styles.wordmark}>loom</span>
      </div>
      <div className={styles.spacer} />
      <LoginButton />
    </header>
  );
}
