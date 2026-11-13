import { useCallback, useEffect, useRef } from "react";

/** Default lock window after a navigation call. */
export const NAV_LOCK_MS = 500;

/**
 * Navigation double-tap lock (Allowed addition #3). Returns `guard(fn)`, which
 * wraps a handler so repeat calls are ignored for ~500ms, or until the promise
 * the handler returned settles, whichever is later.
 *
 *   const guard = useNavLock();
 *   <PaperPrint onPress={guard(() => navigation.navigate("Detail", { id }))} />
 */
export function useNavLock(ms: number = NAV_LOCK_MS) {
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return useCallback(
    <A extends unknown[]>(fn: (...args: A) => unknown) =>
      (...args: A): void => {
        if (locked.current) return;
        locked.current = true;
        const started = Date.now();
        const release = () => {
          const wait = Math.max(0, ms - (Date.now() - started));
          timer.current = setTimeout(() => {
            locked.current = false;
          }, wait);
        };
        let result: unknown;
        try {
          result = fn(...args);
        } catch (e) {
          release();
          throw e;
        }
        if (result && typeof (result as Promise<unknown>).then === "function") {
          (result as Promise<unknown>).then(release, release);
        } else {
          release();
        }
      },
    [ms]
  );
}
