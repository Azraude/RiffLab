import { useCallback, useRef } from 'react';

/**
 * Long-press detector. Fires `callback` after `ms` of continuous press.
 * Returns props to spread on the target element, plus `wasLongPress()` to
 * read in a sibling click handler so you can preventDefault the click that
 * follows the release.
 *
 * Usage:
 *   const lp = useLongPress(() => askDelete(), 500);
 *   <Card {...lp.handlers}>
 *     <Link onClick={(e) => lp.wasLongPress() && e.preventDefault()} ... />
 *   </Card>
 */
export function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      callback();
    }, ms);
  }, [callback, ms]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const wasLongPress = useCallback(() => {
    if (firedRef.current) {
      firedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchMove: clear,
      onTouchCancel: clear,
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
    },
    wasLongPress,
  };
}
