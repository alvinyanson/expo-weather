import { useEffect, useState } from 'react';
import { Barometer } from 'expo-sensors';

export type BarometerStatus = 'checking' | 'available' | 'unavailable';

// Subscribes to the device barometer. Degrades gracefully to 'unavailable' on
// devices/emulators without the sensor. Returns pressure in hPa.
export const useBarometer = (options?: { intervalMs?: number }) => {
  const intervalMs = options?.intervalMs ?? 5000;
  const [status, setStatus] = useState<BarometerStatus>('checking');
  const [pressure, setPressure] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    (async () => {
      const isAvailable = await Barometer.isAvailableAsync();
      if (cancelled) return;

      if (!isAvailable) {
        setStatus('unavailable');
        return;
      }

      setStatus('available');
      Barometer.setUpdateInterval(intervalMs);
      subscription = Barometer.addListener(({ pressure: next }) => setPressure(next));
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [intervalMs]);

  return { status, pressure };
};
