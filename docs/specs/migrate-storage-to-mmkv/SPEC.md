# Feature: Migrate Storage to MMKV

## Intent

Replace `@react-native-async-storage/async-storage` with `react-native-mmkv` as the primary storage engine for Zustand client state persistence and TanStack Query server state cache persistence, improving startup and persistence I/O performance via synchronous memory-mapped storage.

## Context

- **Problem statement:**
  - The app currently uses `@react-native-async-storage/async-storage` across all persisted Zustand stores (`src/store/useSettingsStore.ts:46`, `src/store/useSearchStore.ts:25`, `src/store/useOnboardingStore.ts:22`) and TanStack Query cache persistence (`src/app/_layout.tsx:46-48`).
  - `AsyncStorage` relies on asynchronous native bridge calls and asynchronous file I/O on Android, introducing latency overhead during store rehydration on app startup and state writes.
  - Storage adapters are currently coupled directly to `AsyncStorage` in each individual store file rather than using a centralized storage service module.
- **Current code:**
  - `src/app/_layout.tsx`: Initializes `asyncStoragePersister` via `@tanstack/query-async-storage-persister` with `AsyncStorage` (`:46-48`) and passes it to `PersistQueryClientProvider` (`:113-116`).
  - `src/store/useSettingsStore.ts`: Configures `persist` middleware using `createJSONStorage(() => AsyncStorage)`.
  - `src/store/useSearchStore.ts`: Configures `persist` middleware using `createJSONStorage(() => AsyncStorage)`.
  - `src/store/useOnboardingStore.ts`: Configures `persist` middleware using `createJSONStorage(() => AsyncStorage)` and tracks `hasHydrated` state.
  - `package.json`: Includes `@react-native-async-storage/async-storage` (`:8`), `@react-native-async-storage/expo-with-async-storage` (`:9`), and `@tanstack/query-async-storage-persister` (`:17`).
  - `app.json`: Registers `@react-native-async-storage/expo-with-async-storage` in the `plugins` array (`:29`).
- **User impact:**
  - Faster app startup as Zustand client state and TanStack Query cache rehydrate synchronously without asynchronous bridge latency.
  - Eliminates potential layout flickers or loading delays caused by asynchronous store rehydration on cold start.
  - Centralizes storage engine configuration in an isolated service module (`src/services/storage.ts`).
- **Dependencies:**
  - `react-native-mmkv` for C++ MMKV synchronous storage engine.
  - `@tanstack/query-sync-storage-persister` for synchronous TanStack Query cache persistence.

## Data Model

N/A — No database or relational schema changes. Persisted key names (`'settings-storage'`, `'recent-searches-storage'`, `'onboarding-storage'`, `REACT_QUERY_OFFLINE_CACHE`) remain identical to ensure transparent key compatibility across the storage engine migration.

## Interfaces / API

### `src/services/storage.ts` (Service Module)

```ts
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';
import { Persister } from '@tanstack/react-query-persist-client';

/** Centralized MMKV storage instance */
export const appStorage: MMKV;

/** Synchronous StateStorage adapter for Zustand persist middleware */
export const mmkvZustandStorage: StateStorage;

/** Synchronous Persister for TanStack Query PersistQueryClientProvider */
export const mmkvQueryPersister: Persister;

/** Clears all stored key-value entries in MMKV */
export function clearAllStorage(): void;
```

- `mmkvZustandStorage.getItem(name)` calls `appStorage.getString(name) ?? null`.
- `mmkvZustandStorage.setItem(name, value)` calls `appStorage.set(name, value)`.
- `mmkvZustandStorage.removeItem(name)` calls `appStorage.delete(name)`.
- `mmkvQueryPersister` is created using `createSyncStoragePersister` wrapping `appStorage`.

## Files Created

| File                                         | Purpose                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `docs/specs/migrate-storage-to-mmkv/SPEC.md` | Implementation specification for migrating storage to MMKV.                                               |
| `src/services/storage.ts`                    | Centralized MMKV instance, Zustand `mmkvZustandStorage` adapter, and TanStack Query `mmkvQueryPersister`. |
| `src/tests/services/storage.test.ts`         | Unit tests for MMKV storage service operations and clear functionality.                                   |

## Files Modified

| File                                         | Change                                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                               | Add `react-native-mmkv` and `@tanstack/query-sync-storage-persister`; remove `@tanstack/query-async-storage-persister` and `@react-native-async-storage/expo-with-async-storage`. |
| `app.json`                                   | Remove `@react-native-async-storage/expo-with-async-storage` from `plugins`.                                                                                                      |
| `src/services/index.ts`                      | Re-export `storage.ts`.                                                                                                                                                           |
| `src/app/_layout.tsx`                        | Import `mmkvQueryPersister` from `@/services` and replace `createAsyncStoragePersister` / `AsyncStorage`.                                                                         |
| `src/store/useSettingsStore.ts`              | Replace `AsyncStorage` with `mmkvZustandStorage` adapter.                                                                                                                         |
| `src/store/useSearchStore.ts`                | Replace `AsyncStorage` with `mmkvZustandStorage` adapter.                                                                                                                         |
| `src/store/useOnboardingStore.ts`            | Replace `AsyncStorage` with `mmkvZustandStorage` adapter; set `hasHydrated` synchronously on store creation.                                                                      |
| `src/tests/setup.ts`                         | Add Vitest mock for `react-native-mmkv` class and methods.                                                                                                                        |
| `src/tests/store/useSettingsStore.test.ts`   | Update mocks to use `react-native-mmkv`.                                                                                                                                          |
| `src/tests/store/useSearchStore.test.ts`     | Update mocks to use `react-native-mmkv`.                                                                                                                                          |
| `src/tests/store/useOnboardingStore.test.ts` | Update mocks to use `react-native-mmkv`.                                                                                                                                          |
| `src/tests/app/onboarding.test.tsx`          | Update mock declarations for storage.                                                                                                                                             |
| `src/tests/app/index.test.tsx`               | Update mock declarations for storage.                                                                                                                                             |

## Implementation Steps

1. Install `react-native-mmkv` and `@tanstack/query-sync-storage-persister` via `pnpm add react-native-mmkv @tanstack/query-sync-storage-persister`, and remove legacy packages `@tanstack/query-async-storage-persister` and `@react-native-async-storage/expo-with-async-storage`.
2. Update `app.json` to remove `@react-native-async-storage/expo-with-async-storage` from the `plugins` array.
3. Update `src/tests/setup.ts` to add a global mock for `react-native-mmkv` using an in-memory `Map` class implementation to support Vitest/JSDOM execution.
4. Create `src/services/storage.ts` instantiating `new MMKV()`, exporting `mmkvZustandStorage` (`StateStorage`) and `mmkvQueryPersister` (`createSyncStoragePersister`).
5. Re-export storage functions and types from `src/services/index.ts`.
6. Update `src/store/useSettingsStore.ts`, `src/store/useSearchStore.ts`, and `src/store/useOnboardingStore.ts` to replace `createJSONStorage(() => AsyncStorage)` with `createJSONStorage(() => mmkvZustandStorage)`.
7. Update `src/app/_layout.tsx` to use `mmkvQueryPersister` with `PersistQueryClientProvider` and remove `AsyncStorage` imports.
8. Write unit tests in `src/tests/services/storage.test.ts` and update existing store test mocks in `src/tests/store/`.
9. Run validation commands:
   - `npx tsc --noEmit`
   - `pnpm run lint`
   - `pnpm test`

## Style & Conventions

- Follows `CLAUDE.md`: services in `src/services/`, re-exported via `src/services/index.ts`, path alias `@/`.
- Preserves existing Zustand store keys (`'settings-storage'`, `'recent-searches-storage'`, `'onboarding-storage'`) for backwards compatibility.
- Centralizes storage engine instantiation in `src/services/storage.ts` to keep store definitions and layout components isolated from native storage details.
- Avoids manual `useCallback`/`useMemo` usage per React Compiler setting in `app.json`.

## Acceptance Criteria

- [ ] `react-native-mmkv` replaces `AsyncStorage` as the persistence backend for all Zustand stores (`useSettingsStore`, `useSearchStore`, `useOnboardingStore`).
- [ ] `mmkvQueryPersister` derived from `createSyncStoragePersister` replaces `asyncStoragePersister` in `src/app/_layout.tsx`.
- [ ] `src/services/storage.ts` exports `appStorage`, `mmkvZustandStorage`, and `mmkvQueryPersister`.
- [ ] Unit tests for `storage.ts` and all Zustand stores pass under Vitest.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass with zero errors.

## Constraints

- **Native Module Execution:** `react-native-mmkv` relies on native C++ JSI bindings on device/emulator (`pnpm run android`). It must be mocked in `src/tests/setup.ts` for Vitest / JSDOM unit tests.
- **Synchronous I/O:** Since MMKV operates synchronously on the JavaScript thread, payload size for cached data (e.g. TanStack Query cache) should be kept reasonable to avoid main thread bottlenecks.
- **Non-goals:** Benchmarking tools or latency metrics scripts — deliberately excluded to focus strictly on storage engine migration. Relational database migrations (e.g. SQLite, scoped in a separate roadmap item) and web-specific MMKV fallbacks (the app is strictly Android-scoped per `docs/features.md`) are also non-goals.
