# Feature: Reorder Saved Locations with Drag and Drop

## Intent

The user can long-press and drag saved locations into a preferred order on the Saved Locations screen (`src/app/saved.tsx`), with the updated list order saved optimistically in client state and persisted to Firestore under an `order` field.

## Context

- **Problem statement:** Saved locations in Firestore are currently retrieved and sorted exclusively by creation timestamp (`createdAt` descending). Users cannot customize or reorder their saved locations list to prioritize preferred cities.
- **Current code:**
  - `src/interfaces/savedLocation.ts`: Defines `SavedLocation` (`id`, `city`, `lat`, `lon`, `createdAt`, `userId`) and `SaveLocationInput`.
  - `src/services/firestore.service.ts`: `SavedLocationDoc` maps `city`, `lat`, `lon`, `userId`, `createdAt`. `getSavedLocations` queries documents by `userId` and sorts them in-memory by `createdAt` descending. `saveLocation` and `deleteSavedLocation` handle item persistence.
  - `src/hooks/useSavedLocations.ts`: TanStack Query hook managing `['savedLocations', uid]` cache with optimistic updates for save and delete operations.
  - `src/app/saved.tsx`: Renders saved locations using a standard React Native `FlatList` and `SavedLocationItem` components (which currently support swipe-to-delete via `ReanimatedSwipeable`).
  - Dependencies present in `package.json`: `react-native-gesture-handler` (`~2.31.1`), `react-native-reanimated` (`4.3.1`), `@react-native-firebase/firestore` (`^25.0.1`), `@tanstack/react-query` (`^5.101.0`). `react-native-draggable-flatlist` is not yet installed.
- **User impact:** Provides users with drag-and-drop gesture controls to personalize the display hierarchy of their saved weather locations across app launches.
- **Dependencies:** `react-native-draggable-flatlist` (new package to add to `package.json`).

## Data Model

- **`SavedLocation` interface update (`src/interfaces/savedLocation.ts`):**
  ```ts
  export interface SavedLocation {
    id: string;
    city: string;
    lat: number;
    lon: number;
    createdAt: number | null;
    userId: string;
    order?: number;
  }
  ```
- **`SavedLocationDoc` update (`src/services/firestore.service.ts`):**
  ```ts
  interface SavedLocationDoc {
    city: string;
    lat: number;
    lon: number;
    userId: string;
    createdAt: FirebaseFirestoreTypes.Timestamp | null;
    order?: number;
  }
  ```
- **Invariants & Fallback Sorting:**
  - `order` is a 0-indexed number representing list position.
  - Documents without an explicit `order` field fall back to `createdAt` descending sorting and are ordered after explicitly ordered items.
  - `getSavedLocations` sorts results primary by `order` (ascending), secondary by `createdAt` (descending).

## Interfaces / API

### `updateSavedLocationOrders` (new service function) — `src/services/firestore.service.ts`

```ts
export interface LocationOrderUpdate {
  id: string;
  order: number;
}

export const updateSavedLocationOrders = async (updates: LocationOrderUpdate[]): Promise<void> => {
  const db = getFirestore();
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    const ref = doc(db, 'saved_locations', id);
    batch.update(ref, { order });
  });
  await batch.commit();
};
```

### `useSavedLocations` hook extensions — `src/hooks/useSavedLocations.ts`

```ts
// Returned from useSavedLocations hook:
reorderSavedLocations: (newOrder: SavedLocation[]) => Promise<void>;
isReordering: boolean;
```

Behavior contract:

- `reorderSavedLocations(newOrder)` accepts the reordered array of `SavedLocation` items.
- Optimistically updates `['savedLocations', uid]` query cache with assigned 0-based `order` properties.
- Triggers `haptics.selection()` or `haptics.impact()` when reorder commits.
- Executes `updateSavedLocationOrders` batch write for changed document positions.
- Rolls back query cache and shows error toast if the Firestore mutation fails.
- Invalidates `['savedLocations', uid]` query on settled.

### Component Props — `src/components/SavedLocationItem.tsx`

```ts
interface SavedLocationItemProps {
  location: SavedLocation;
  onDelete: (location: SavedLocation) => void;
  onPress: () => void;
  drag?: () => void;
  isActive?: boolean;
}
```

- When `drag` is provided, a drag handle icon (`symbol: drag_handle` / `line.3.horizontal`) is rendered, which triggers `drag()` on long-press or press.
- When `isActive` is true, item styling adjusts visual elevation / scale for drag state feedback.

## Files Created

| File                                               | Purpose                                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/tests/hooks/useSavedLocationsReorder.test.ts` | Unit tests for `reorderSavedLocations` optimistic cache updates, Firestore batch calls, and error rollback. |

## Files Modified

| File                                           | Change                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                 | Add `react-native-draggable-flatlist` dependency.                                                                                                                   |
| `src/interfaces/savedLocation.ts`              | Add optional `order?: number` to `SavedLocation`.                                                                                                                   |
| `src/services/firestore.service.ts`            | Add `order` to `SavedLocationDoc` and `mapDoc`; update `getSavedLocations` sorting to prioritize `order`; implement `updateSavedLocationOrders` using `writeBatch`. |
| `src/services/index.ts`                        | Re-export `updateSavedLocationOrders`.                                                                                                                              |
| `src/hooks/useSavedLocations.ts`               | Add `reorderMutation` with optimistic update and error recovery; return `reorderSavedLocations` and `isReordering`.                                                 |
| `src/components/SavedLocationItem.tsx`         | Add optional `drag` handle callback, `isActive` styling, and drag symbol icon.                                                                                      |
| `src/app/saved.tsx`                            | Replace `FlatList` with `DraggableFlatList` from `react-native-draggable-flatlist`; wire `onDragEnd` to `reorderSavedLocations`.                                    |
| `src/tests/services/firestore.service.test.ts` | Add unit tests for `updateSavedLocationOrders` and `order`-based sorting in `getSavedLocations`.                                                                    |
| `src/tests/app/saved.test.tsx`                 | Update test mocks for `DraggableFlatList` and verify list item drag rendering.                                                                                      |
| `src/tests/setup.ts`                           | Add test environment mocks for `react-native-draggable-flatlist`.                                                                                                   |

## Implementation Steps

1. Add `react-native-draggable-flatlist` to `package.json`.
2. Update `SavedLocation` in `src/interfaces/savedLocation.ts` to include optional `order?: number`.
3. Modify `src/services/firestore.service.ts`:
   - Update `SavedLocationDoc` and `mapDoc` to support `order`.
   - Update `getSavedLocations` sorting logic: compare `order` values first (ascending), fallback to `createdAt` (descending).
   - Add `updateSavedLocationOrders(updates: LocationOrderUpdate[])` using Firestore `writeBatch`.
   - Re-export `updateSavedLocationOrders` in `src/services/index.ts`.
4. Update `src/tests/services/firestore.service.test.ts` to verify `updateSavedLocationOrders` batch execution and `order` field sorting.
5. Enhance `src/hooks/useSavedLocations.ts`:
   - Implement `reorderMutation` using `useMutation` with optimistic `queryClient.setQueryData` and error rollback.
   - Return `reorderSavedLocations` and `isReordering`.
6. Add `src/tests/hooks/useSavedLocationsReorder.test.ts` verifying optimistic reordering and network error rollback.
7. Update `src/components/SavedLocationItem.tsx`:
   - Add `drag` and `isActive` props.
   - Render a drag handle icon using `SymbolView` (`ios: 'line.3.horizontal'`, `android: 'drag_handle'`).
   - Trigger `drag` on drag handle interaction.
8. Update `src/app/saved.tsx`:
   - Replace standard `FlatList` with `DraggableFlatList`.
   - Pass `onDragEnd={({ data }) => reorderSavedLocations(data)}` and trigger haptics.
9. Update `src/tests/setup.ts` and `src/tests/app/saved.test.tsx` to mock `react-native-draggable-flatlist` in Vitest jsdom setup.
10. Run verification commands:
    - `npx tsc --noEmit`
    - `pnpm run lint`
    - `pnpm test`

## Style & Conventions

- Follows repository standards in `CLAUDE.md`: strict TypeScript, named exports, path aliases (`@/`), design tokens (`src/theme/index.ts`).
- Uses existing `useHaptics` hook (`haptics.selection()`, `haptics.impact()`) for tactile feedback during drag actions.
- Uses TanStack Query optimistic mutation pattern (`onMutate`, `cancelQueries`, `setQueryData`, `onError` rollback, `onSettled` invalidation) consistent with `useSavedLocations.ts`.
- Uses Firestore `writeBatch` for atomic multi-doc updates.

## Acceptance Criteria

- [ ] `SavedLocation` type and Firestore document mapping support `order?: number`.
- [ ] `getSavedLocations` sorts items by `order` ascending (fallback to `createdAt` descending for un-ordered locations).
- [ ] `updateSavedLocationOrders` executes a Firestore `writeBatch` to update doc order fields atomically.
- [ ] Users can long-press and drag saved locations on `SavedLocationsScreen` (`src/app/saved.tsx`) to reorder the list.
- [ ] Reordering updates UI state immediately (optimistic update) and triggers haptic feedback.
- [ ] Network failure during reorder reverts the list order and displays an error toast notification.
- [ ] Unit tests cover batch order updates, sorting, and optimistic reorder mutations.
- [ ] `npx tsc --noEmit`, `pnpm run lint`, and `pnpm test` pass without errors or warnings.

## Constraints

- **Scope boundaries:** Reordering applies to the saved locations list on `SavedLocationsScreen` (`src/app/saved.tsx`).
- **Batch limits:** Firestore batch writes support up to 500 operations per batch, which exceeds maximum typical saved locations per user (< 50).
- **Non-goals:** No auto-sorting by temperature or alphabetical order, no custom folder/category groupings.
