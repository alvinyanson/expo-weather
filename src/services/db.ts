import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'expo-weather.db';

let dbInstance: SQLiteDatabase | null = null;

/** Opens (or reuses) the app's single SQLite database. */
export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await openDatabaseAsync(DB_NAME);
  return dbInstance;
}
