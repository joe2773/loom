import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { CropRect } from '../types';

interface DragStart {
  x: number;
  y: number;
  clientRect: DOMRect;
}

export interface RegionSelector {
  overlayRef: RefObject<HTMLDivElement>;
  boxRef: RefObject<HTMLDivElement>;
  cropRect: CropRect | null;
  active: boolean;
  activate: () => void;
  clear: () => void;
}

export function useRegionSelector(): RegionSelector {
  const overlayRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [active, setActive] = useState(false);

  const computeNormalized = useCallback((e: MouseEvent): CropRect => {
    const drag = dragStartRef.current!;
    const { x: startX, y: startY, clientRect } = drag;
    const curX = Math.max(0, Math.min(1, (e.clientX - clientRect.left) / clientRect.width));
    const curY = Math.max(0, Math.min(1, (e.clientY - clientRect.top) / clientRect.height));
    return {
      x: Math.min(startX, curX),
      y: Math.min(startY, curY),
      width: Math.abs(curX - startX),
      height: Math.abs(curY - startY),
    };
  }, []);

  const updateBox = useCallback((e: MouseEvent) => {
    const overlay = overlayRef.current;
    const box = boxRef.current;
    if (!overlay || !box || !dragStartRef.current) return;
    const { x, y, width, height } = computeNormalized(e);
    const containerRect = overlay.getBoundingClientRect();
    box.style.left = `${x * containerRect.width}px`;
    box.style.top = `${y * containerRect.height}px`;
    box.style.width = `${width * containerRect.width}px`;
    box.style.height = `${height * containerRect.height}px`;
  }, [computeNormalized]);

  const clear = useCallback(() => {
    setCropRect(null);
    if (boxRef.current) boxRef.current.style.display = 'none';
  }, []);

  const activate = useCallback(() => {
    setActive(true);
  }, []);

  // Attach mousedown when active; mousemove/mouseup are added on demand during drag
  useEffect(() => {
    if (!active) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    function onMouseMove(e: MouseEvent) {
      if (!dragStartRef.current) return;
      updateBox(e);
    }

    function onMouseUp(e: MouseEvent) {
      if (!dragStartRef.current) return;
      updateBox(e);

      const { x, y, width, height } = computeNormalized(e);
      if (width < 0.01 || height < 0.01) {
        clear();
      } else {
        setCropRect({ x, y, width, height });
      }

      dragStartRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setActive(false);
    }

    function onMouseDown(e: MouseEvent) {
      e.preventDefault();
      const overlayEl = overlayRef.current;
      const box = boxRef.current;
      if (!overlayEl) return;
      const rect = overlayEl.getBoundingClientRect();
      dragStartRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        clientRect: rect,
      };
      if (box) box.style.display = 'block';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    overlay.addEventListener('mousedown', onMouseDown);
    return () => {
      overlay.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [active, clear, computeNormalized, updateBox]);

  return { overlayRef, boxRef, cropRect, active, activate, clear };
}
