import { useEffect, type RefObject } from 'react';

export function useClickOutside(
  refs: Array<RefObject<HTMLElement>>,
  active: boolean,
  onOutside: () => void,
): void {
  useEffect(() => {
    if (!active) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      for (const ref of refs) {
        if (ref.current && ref.current.contains(target)) return;
      }
      onOutside();
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [refs, active, onOutside]);
}
