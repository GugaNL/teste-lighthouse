import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface DebouncedCallback<A extends unknown[]> {
  run: (...args: A) => void;
  cancel: () => void;
}

export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 300
): DebouncedCallback<A> {
  const callbackRef = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  );

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}
