import { useRef, useEffect, useCallback } from 'react';

// Debounces `callback` by `delay` ms. If the page is hidden or unloaded (reload, tab close,
// app backgrounded on mobile) while a call is pending, it fires immediately instead of being lost.
// Unmounting still cancels the pending call.
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const flush = useCallback(() => {
    if (timeoutRef.current === null) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    const args = pendingArgsRef.current;
    pendingArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        pendingArgsRef.current = null;
      }
    };
  }, [flush]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    pendingArgsRef.current = args;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      const pendingArgs = pendingArgsRef.current;
      pendingArgsRef.current = null;
      callbackRef.current(...pendingArgs);
    }, delay);
  }, [delay]);

  return debouncedCallback;
};

export default useDebounce;
