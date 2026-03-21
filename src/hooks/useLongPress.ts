import { useRef, useCallback } from "react";

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useLongPress(
  onLongPress: (pos: { x: number; y: number }) => void,
  delay = 500,
): { handlers: LongPressHandlers; wasLongPress: () => boolean } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const { clientX: x, clientY: y } = e.touches[0];
      startPosRef.current = { x, y };
      triggeredRef.current = false;

      timerRef.current = setTimeout(() => {
        triggeredRef.current = true;
        navigator.vibrate?.(30);
        onLongPress({ x, y });
      }, delay);
    },
    [onLongPress, delay],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(e.touches[0].clientX - startPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clear();
      }
    },
    [clear],
  );

  const onTouchEnd = useCallback(() => {
    clear();
    startPosRef.current = null;
  }, [clear]);

  const wasLongPress = useCallback(() => triggeredRef.current, []);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    wasLongPress,
  };
}
