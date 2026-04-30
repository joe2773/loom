import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './RecordingPill.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const PillButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, className, ...rest }, ref) => (
    <button {...rest} ref={ref} className={`${styles.btn} ${className ?? ''}`.trim()}>
      {children}
    </button>
  ),
);
PillButton.displayName = 'PillButton';
