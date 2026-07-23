import { SQLiteDatabase } from 'expo-sqlite';
import { WeatherHistoryRow } from '@/interfaces';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates the weather_history table and index if they do not exist.
 * Prunes rows older than 30 days.
 * Must be called once on app startup before any reads or writes.
 */
export async function initWeatherHistoryDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weather_history (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      fetched_at       TEXT    NOT NULL,
      latitude         REAL    NOT NULL,
      longitude        REAL    NOT NULL,
      city             TEXT    NOT NULL,
      temperature      REAL    NOT NULL,
      weather_code     INTEGER NOT NULL,
      humidity         INTEGER NOT NULL,
      wind_speed       REAL    NOT NULL,
      pressure         REAL,
      temp_max         REAL    NOT NULL,
      temp_min         REAL    NOT NULL,
      temperature_unit TEXT    NOT NULL,
      wind_speed_unit  TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_weather_history_location_time
      ON weather_history (latitude, longitude, fetched_at DESC);
  `);

  // Prune rows older than 30 days
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  await db.runAsync('DELETE FROM weather_history WHERE fetched_at < ?', [cutoff]);
}

/**
 * Inserts one snapshot row. latitude and longitude are stored as-is (4 dp precision).
 */
export async function insertWeatherSnapshot(
  db: SQLiteDatabase,
  params: Omit<WeatherHistoryRow, 'id'>,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO weather_history
      (fetched_at, latitude, longitude, city, temperature, weather_code, humidity,
       wind_speed, pressure, temp_max, temp_min, temperature_unit, wind_speed_unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.fetched_at,
      params.latitude,
      params.longitude,
      params.city,
      params.temperature,
      params.weather_code,
      params.humidity,
      params.wind_speed,
      params.pressure ?? null,
      params.temp_max,
      params.temp_min,
      params.temperature_unit,
      params.wind_speed_unit,
    ],
  );
}

/**
 * Returns all rows for a given location (matched within ±0.01°),
 * ordered by fetched_at DESC, limited to the most recent `limit` rows (default 200).
 */
export async function fetchWeatherHistory(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
  limit = 200,
): Promise<WeatherHistoryRow[]> {
  return db.getAllAsync<WeatherHistoryRow>(
    `SELECT * FROM weather_history
     WHERE latitude BETWEEN ? AND ?
       AND longitude BETWEEN ? AND ?
     ORDER BY fetched_at DESC
     LIMIT ?`,
    [latitude - 0.01, latitude + 0.01, longitude - 0.01, longitude + 0.01, limit],
  );
}

/**
 * Deletes all rows for the specified location (matched within ±0.01°).
 */
export async function clearLocationHistory(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
): Promise<void> {
  await db.runAsync(
    `DELETE FROM weather_history
     WHERE latitude BETWEEN ? AND ?
       AND longitude BETWEEN ? AND ?`,
    [latitude - 0.01, latitude + 0.01, longitude - 0.01, longitude + 0.01],
  );
}
