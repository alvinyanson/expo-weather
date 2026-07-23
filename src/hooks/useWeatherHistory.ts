import { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { DailyWeatherSummary, WeatherHistoryRow } from '@/interfaces';
import { clearLocationHistory, fetchWeatherHistory } from '@/services/weatherHistory.service';

/**
 * Reads WeatherHistoryRow[] for a given location from SQLite and
 * groups them into DailyWeatherSummary[]. Exposes a clearHistory action
 * that deletes all rows for the location and re-queries.
 */
export function useWeatherHistory(
  db: SQLiteDatabase | null,
  latitude: number,
  longitude: number,
): {
  summaries: DailyWeatherSummary[];
  isLoading: boolean;
  clearHistory: () => Promise<void>;
} {
  const [rows, setRows] = useState<WeatherHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!db) return;
      setIsLoading(true);
      try {
        const result = await fetchWeatherHistory(db, latitude, longitude);
        if (!cancelled) {
          setRows(result);
        }
      } catch (error) {
        console.error('[useWeatherHistory] Failed to fetch history:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // refreshTick drives re-fetches after clearHistory
  }, [db, latitude, longitude, refreshTick]);

  const clearHistory = async () => {
    if (!db) return;
    await clearLocationHistory(db, latitude, longitude);
    setRefreshTick((t) => t + 1);
  };

  // Group rows into DailyWeatherSummary by UTC date prefix (YYYY-MM-DD)
  const summaries = groupByDay(rows);

  return { summaries, isLoading, clearHistory };
}

function groupByDay(rows: WeatherHistoryRow[]): DailyWeatherSummary[] {
  const map = new Map<string, WeatherHistoryRow[]>();

  for (const row of rows) {
    const date = row.fetched_at.slice(0, 10); // 'YYYY-MM-DD'
    const bucket = map.get(date);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(date, [row]);
    }
  }

  const summaries: DailyWeatherSummary[] = [];
  for (const [date, snapshots] of map) {
    summaries.push({
      date,
      temp_min: Math.min(...snapshots.map((s) => s.temp_min)),
      temp_max: Math.max(...snapshots.map((s) => s.temp_max)),
      // 'data' is required by SectionList's SectionListData interface
      data: snapshots,
      snapshots,
    });
  }

  return summaries;
}
