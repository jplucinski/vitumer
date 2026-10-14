import { useCallback, useEffect, useRef } from 'react';

export function useScreenWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(active);

  const request = useCallback(async () => {
    if (!activeRef.current || !('wakeLock' in navigator)) return;
    if (document.visibilityState !== 'visible') return;
    try {
      const next = await navigator.wakeLock.request('screen');
      if (!activeRef.current) {
        await next.release();
        return;
      }
      const previous = sentinelRef.current;
      sentinelRef.current = next;
      if (previous && previous !== next) void previous.release().catch(() => {});
    } catch {
      // Denied when the context is insecure, the device is low on power, or no user gesture was seen yet.
    }
  }, []);

  const hold = useCallback(() => {
    activeRef.current = true;
    void request();
  }, [request]);

  useEffect(() => {
    activeRef.current = active;

    if (!active) {
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
      return;
    }

    void request();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active, request]);

  return hold;
}
