import { forwardRef } from 'react';
import styles from './PreviewContainer.module.css';

interface Props {
  visible: boolean;
}

interface Refs {
  overlay: React.RefObject<HTMLDivElement>;
  box: React.RefObject<HTMLDivElement>;
}

export const RegionOverlay = forwardRef<HTMLDivElement, Props & { boxRef: React.RefObject<HTMLDivElement> }>(
  ({ visible, boxRef }, overlayRef) => (
    <>
      <div
        id="region-overlay"
        ref={overlayRef}
        className={styles.regionOverlay}
        style={{ display: visible ? 'block' : 'none' }}
      />
      <div id="selection-box" ref={boxRef} className={styles.selectionBox} />
    </>
  ),
);
RegionOverlay.displayName = 'RegionOverlay';

export type { Refs };
