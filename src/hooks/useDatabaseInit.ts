import { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { getDatabase } from '@/services/db';
import { initWeatherHistoryDb } from '@/services/weatherHistory.service';

/**
 * Opens the SQLite database and runs initWeatherHistoryDb() on mount.
 * Called once inside RootLayout. Returns { db, isReady }.
 */
export function useDatabaseInit(): { db: SQLiteDatabase | null; isReady: boolean } {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const database = await getDatabase();
        await initWeatherHistoryDb(database);
        if (!cancelled) {
          setDb(database);
          setIsReady(true);
        }
      } catch (error) {
        // DB init failure is non-fatal: the rest of the app still works.
        console.error('[useDatabaseInit] Failed to initialize SQLite:', error);
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return { db, isReady };
}
