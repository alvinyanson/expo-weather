import { describe, expect, it } from 'vitest';
import {
  clearLocationHistory,
  fetchWeatherHistory,
  initWeatherHistoryDb,
  insertWeatherSnapshot,
} from '@/services/weatherHistory.service';
import type { WeatherHistoryRow } from '@/interfaces';

// Minimal mock db built from the shape defined in setup.ts.
// The module-level beforeEach in setup.ts resets the in-memory store.
async function buildDb() {
  const { openDatabaseAsync } = await import('expo-sqlite');
  return openDatabaseAsync('test.db') as unknown as Awaited<ReturnType<typeof openDatabaseAsync>>;
}

const baseSnapshot: Omit<WeatherHistoryRow, 'id'> = {
  fetched_at: '2026-07-01T00:00:00.000Z',
  latitude: 14.5995,
  longitude: 120.9842,
  city: 'Manila',
  temperature: 32.5,
  weather_code: 0,
  humidity: 70,
  wind_speed: 15.2,
  pressure: 1013.25,
  temp_max: 35.0,
  temp_min: 28.0,
  temperature_unit: 'celsius',
  wind_speed_unit: 'kmh',
};

describe('initWeatherHistoryDb', () => {
  it('creates the table without throwing', async () => {
    const db = await buildDb();
    await expect(initWeatherHistoryDb(db)).resolves.toBeUndefined();
  });
});

describe('insertWeatherSnapshot + fetchWeatherHistory', () => {
  it('inserts a row and retrieves it for the same location', async () => {
    const db = await buildDb();
    await insertWeatherSnapshot(db, baseSnapshot);

    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);
    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.city).toBe('Manila');
    expect(rows.at(0)?.temperature).toBe(32.5);
    expect(rows.at(0)?.pressure).toBe(1013.25);
  });

  it('returns rows ordered by fetched_at DESC', async () => {
    const db = await buildDb();
    const older: Omit<WeatherHistoryRow, 'id'> = {
      ...baseSnapshot,
      fetched_at: '2026-07-01T06:00:00.000Z',
    };
    const newer: Omit<WeatherHistoryRow, 'id'> = {
      ...baseSnapshot,
      fetched_at: '2026-07-01T12:00:00.000Z',
    };
    await insertWeatherSnapshot(db, older);
    await insertWeatherSnapshot(db, newer);

    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);
    expect(rows.at(0)?.fetched_at).toBe('2026-07-01T12:00:00.000Z');
    expect(rows.at(1)?.fetched_at).toBe('2026-07-01T06:00:00.000Z');
  });

  it('filters by location within ±0.01° tolerance', async () => {
    const db = await buildDb();
    // Same coarse location (within tolerance)
    await insertWeatherSnapshot(db, { ...baseSnapshot, latitude: 14.5999 });
    // Different location (outside tolerance)
    await insertWeatherSnapshot(db, { ...baseSnapshot, latitude: 14.7, city: 'Far Away' });

    const rows = await fetchWeatherHistory(db, 14.5995, 120.9842);
    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.latitude).toBeCloseTo(14.5999, 3);
  });

  it('respects the limit parameter', async () => {
    const db = await buildDb();
    for (let i = 0; i < 5; i++) {
      await insertWeatherSnapshot(db, {
        ...baseSnapshot,
        fetched_at: `2026-07-0${i + 1}T00:00:00.000Z`,
      });
    }

    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude, 3);
    expect(rows).toHaveLength(3);
  });

  it('stores null pressure when absent', async () => {
    const db = await buildDb();
    await insertWeatherSnapshot(db, { ...baseSnapshot, pressure: null });
    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);
    expect(rows.at(0)?.pressure).toBeNull();
  });
});

describe('clearLocationHistory', () => {
  it('deletes all rows for the location and leaves others intact', async () => {
    const db = await buildDb();
    await insertWeatherSnapshot(db, baseSnapshot);
    await insertWeatherSnapshot(db, { ...baseSnapshot, latitude: 14.7, city: 'Other' });

    await clearLocationHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);

    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);
    expect(rows).toHaveLength(0);

    // Other location still exists
    const otherRows = await fetchWeatherHistory(db, 14.7, 120.9842);
    expect(otherRows).toHaveLength(1);
  });
});

describe('30-day pruning', () => {
  it('prunes rows older than 30 days during initWeatherHistoryDb', async () => {
    const db = await buildDb();

    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    // Directly insert rows into the mock store via service
    await insertWeatherSnapshot(db, { ...baseSnapshot, fetched_at: old });
    await insertWeatherSnapshot(db, { ...baseSnapshot, fetched_at: recent });

    await initWeatherHistoryDb(db);

    const rows = await fetchWeatherHistory(db, baseSnapshot.latitude, baseSnapshot.longitude);
    // Old row should be pruned; recent row survives
    expect(rows).toHaveLength(1);
    expect(rows.at(0)?.fetched_at).toBe(recent);
  });
});
