import type { ReactNode } from 'react';
import styles from './SetupPanel.module.css';

interface Props {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export function TypeCard({ id, label, description, icon, disabled, onClick }: Props) {
  return (
    <button id={id} className={styles.typeCard} disabled={disabled} onClick={onClick}>
      <div className={styles.typeIcon}>{icon}</div>
      <span className={styles.typeLabel}>{label}</span>
      <span className={styles.typeDesc}>{description}</span>
    </button>
  );
}
