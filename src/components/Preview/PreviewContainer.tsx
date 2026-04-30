import { forwardRef, type ReactNode, type RefObject } from 'react';
import { RegionOverlay } from './RegionOverlay';
import styles from './PreviewContainer.module.css';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  cropCanvasRef: RefObject<HTMLCanvasElement>;
  regionOverlayRef: RefObject<HTMLDivElement>;
  selectionBoxRef: RefObject<HTMLDivElement>;
  regionActive: boolean;
  children?: ReactNode;
}

export const PreviewContainer = forwardRef<HTMLDivElement, Props>(
  (
    {
      videoRef,
      cropCanvasRef,
      regionOverlayRef,
      selectionBoxRef,
      regionActive,
      children,
    },
    ref,
  ) => (
    <div id="preview-container" ref={ref} className={styles.container}>
      <video id="preview" ref={videoRef} className={styles.video} autoPlay muted playsInline />
      <canvas id="crop-canvas" ref={cropCanvasRef} className={styles.cropCanvas} />
      <RegionOverlay
        ref={regionOverlayRef}
        boxRef={selectionBoxRef}
        visible={regionActive}
      />
      {children}
    </div>
  ),
);
PreviewContainer.displayName = 'PreviewContainer';
