import { useEffect, useRef } from 'react';

export function useIpcIncomingEvent<T>(
  subscribe: (listener: (payload: T) => void) => () => void,
  listener: (payload: T) => void,
): void {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const unsubscribe = subscribe(listenerRef.current);

    return unsubscribe;
    // `subscribe` is a stable method off `window.api`; intentionally mount-only.
  }, []);
}
