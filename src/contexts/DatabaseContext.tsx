import { SQLiteDatabase } from 'expo-sqlite';
import { createContext, useContext } from 'react';

/** Provides the initialized SQLiteDatabase to the component tree. */
export const DatabaseContext = createContext<SQLiteDatabase | null>(null);

/** Consume the database instance provided by DatabaseContext. */
export function useDatabase(): SQLiteDatabase | null {
  return useContext(DatabaseContext);
}
