import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  setDoc,
} from '@react-native-firebase/firestore';
import {
  deleteSavedLocation,
  getSavedLocations,
  saveLocation,
  saveUserPushToken,
  clearUserPushToken,
} from '@/services/firestore.service';

vi.mock('@react-native-firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ __db: true })),
  collection: vi.fn((_db, name) => ({ __collection: name })),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, coll, id) => ({ __doc: `${coll}/${id}` })),
  query: vi.fn((...args) => ({ __query: args })),
  where: vi.fn((field, op, value) => ({ __where: [field, op, value] })),
  serverTimestamp: vi.fn(() => '__SERVER_TS__'),
  setDoc: vi.fn(),
}));

const mockAddDoc = vi.mocked(addDoc);
const mockGetDocs = vi.mocked(getDocs);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockSetDoc = vi.mocked(setDoc);

afterEach(() => {
  vi.clearAllMocks();
});

describe('saveLocation', () => {
  it('writes the location scoped to the user with a server timestamp and returns the new id', async () => {
    mockAddDoc.mockResolvedValue({ id: 'doc-123' } as never);

    const id = await saveLocation('user-1', { city: 'Manila', lat: 14.6, lon: 120.98 });

    expect(id).toBe('doc-123');
    expect(collection).toHaveBeenCalledWith({ __db: true }, 'saved_locations');
    expect(serverTimestamp).toHaveBeenCalled();
    expect(mockAddDoc).toHaveBeenCalledWith(
      { __collection: 'saved_locations' },
      {
        city: 'Manila',
        lat: 14.6,
        lon: 120.98,
        userId: 'user-1',
        createdAt: '__SERVER_TS__',
      },
    );
  });

  it('propagates Firestore errors', async () => {
    mockAddDoc.mockRejectedValue(new Error('permission-denied'));

    await expect(saveLocation('user-1', { city: 'Manila', lat: 1, lon: 2 })).rejects.toThrow(
      'permission-denied',
    );
  });
});

describe('getSavedLocations', () => {
  it('queries by userId only (no composite index) and maps the documents', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'a',
          data: () => ({
            city: 'Tokyo',
            lat: 35.68,
            lon: 139.69,
            userId: 'user-1',
            createdAt: { toMillis: () => 1700000000000 },
          }),
        },
      ],
    } as never);

    const result = await getSavedLocations('user-1');

    expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(query).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 'a',
        city: 'Tokyo',
        lat: 35.68,
        lon: 139.69,
        userId: 'user-1',
        createdAt: 1700000000000,
      },
    ]);
  });

  const makeDoc = (id: string, createdAt: number | null) => ({
    id,
    data: () => ({
      city: id,
      lat: 0,
      lon: 0,
      userId: 'user-1',
      createdAt: createdAt === null ? null : { toMillis: () => createdAt },
    }),
  });

  it('sorts results newest-first in memory, pending timestamps on top', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc('older', 1000), makeDoc('newer', 2000), makeDoc('pending', null)],
    } as never);

    const result = await getSavedLocations('user-1');

    expect(result.map((r) => r.id)).toEqual(['pending', 'newer', 'older']);
  });

  it('maps a pending server timestamp to null', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'b',
          data: () => ({ city: 'Cebu', lat: 10, lon: 123, userId: 'user-1', createdAt: null }),
        },
      ],
    } as never);

    const [location] = await getSavedLocations('user-1');

    expect(location.createdAt).toBeNull();
  });

  it('propagates Firestore errors', async () => {
    mockGetDocs.mockRejectedValue(new Error('unavailable'));

    await expect(getSavedLocations('user-1')).rejects.toThrow('unavailable');
  });
});

describe('deleteSavedLocation', () => {
  it('deletes the document by id', async () => {
    mockDeleteDoc.mockResolvedValue(undefined as never);

    await deleteSavedLocation('doc-123');

    expect(doc).toHaveBeenCalledWith({ __db: true }, 'saved_locations', 'doc-123');
    expect(mockDeleteDoc).toHaveBeenCalledWith({ __doc: 'saved_locations/doc-123' });
  });

  it('propagates Firestore errors', async () => {
    mockDeleteDoc.mockRejectedValue(new Error('not-found'));

    await expect(deleteSavedLocation('missing')).rejects.toThrow('not-found');
  });
});

describe('saveUserPushToken', () => {
  it('updates the user push token and coordinates with merge: true', async () => {
    mockSetDoc.mockResolvedValue(undefined as never);

    await saveUserPushToken('user-123', 'token-abc', 14.6, 120.98);

    expect(doc).toHaveBeenCalledWith({ __db: true }, 'users', 'user-123');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { __doc: 'users/user-123' },
      {
        pushToken: 'token-abc',
        latitude: 14.6,
        longitude: 120.98,
        updatedAt: '__SERVER_TS__',
      },
      { merge: true },
    );
  });

  it('propagates Firestore errors', async () => {
    mockSetDoc.mockRejectedValue(new Error('permission-denied'));

    await expect(saveUserPushToken('user-123', 'token-abc', 14.6, 120.98)).rejects.toThrow(
      'permission-denied',
    );
  });
});

describe('clearUserPushToken', () => {
  it('clears/nullifies the push token and coordinates with merge: true', async () => {
    mockSetDoc.mockResolvedValue(undefined as never);

    await clearUserPushToken('user-123');

    expect(doc).toHaveBeenCalledWith({ __db: true }, 'users', 'user-123');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { __doc: 'users/user-123' },
      {
        pushToken: null,
        latitude: null,
        longitude: null,
        updatedAt: '__SERVER_TS__',
      },
      { merge: true },
    );
  });

  it('propagates Firestore errors', async () => {
    mockSetDoc.mockRejectedValue(new Error('permission-denied'));

    await expect(clearUserPushToken('user-123')).rejects.toThrow('permission-denied');
  });
});
