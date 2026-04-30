import { useCallback, useEffect, useRef, useState } from 'react';

function format(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface TimerControls {
  display: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useTimer(): TimerControls {
  const [display, setDisplay] = useState('00:00');
  const accumulatedRef = useRef(0);
  const startTsRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const elapsed = useCallback((): number => {
    const running = startTsRef.current !== null ? Date.now() - startTsRef.current : 0;
    return accumulatedRef.current + running;
  }, []);

  const tick = useCallback(() => {
    setDisplay(format(elapsed()));
  }, [elapsed]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    accumulatedRef.current = 0;
    startTsRef.current = Date.now();
    tick();
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const pause = useCallback(() => {
    if (startTsRef.current !== null) {
      accumulatedRef.current += Date.now() - startTsRef.current;
      startTsRef.current = null;
    }
    clearTick();
  }, [clearTick]);

  const resume = useCallback(() => {
    startTsRef.current = Date.now();
    tick();
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const stop = useCallback(() => {
    clearTick();
    accumulatedRef.current = 0;
    startTsRef.current = null;
    setDisplay('00:00');
  }, [clearTick]);

  useEffect(() => clearTick, [clearTick]);

  return { display, start, pause, resume, stop };
}
