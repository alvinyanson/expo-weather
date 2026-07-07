import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { SavedLocation, SaveLocationInput } from '@/interfaces';

const COLLECTION = 'saved_locations';

interface SavedLocationDoc {
  city: string;
  lat: number;
  lon: number;
  userId: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
}

/** Maps a Firestore document's id + data into the `SavedLocation` interface. */
const mapDoc = (id: string, data: SavedLocationDoc): SavedLocation => ({
  id,
  city: data.city,
  lat: data.lat,
  lon: data.lon,
  userId: data.userId,
  createdAt: data.createdAt ? data.createdAt.toMillis() : null,
});

/**
 * Persists a new saved location for the given user. Returns the new document id.
 */
export const saveLocation = async (
  userId: string,
  location: SaveLocationInput,
): Promise<string> => {
  const db = getFirestore();
  const ref = await addDoc(collection(db, COLLECTION), {
    city: location.city,
    lat: location.lat,
    lon: location.lon,
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Fetches every location the given user has saved, newest first.
 */
export const getSavedLocations = async (userId: string): Promise<SavedLocation[]> => {
  const db = getFirestore();
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => mapDoc(d.id, d.data() as SavedLocationDoc))
    .toSorted((a, b) => (b.createdAt ?? Infinity) - (a.createdAt ?? Infinity));
};

/**
 * Deletes a single saved location document by id.
 */
export const deleteSavedLocation = async (id: string): Promise<void> => {
  const db = getFirestore();
  await deleteDoc(doc(db, COLLECTION, id));
};

/**
 * Saves/updates the user's push token and coordinate details in their user document.
 */
export const saveUserPushToken = async (
  userId: string,
  token: string,
  latitude: number,
  longitude: number,
): Promise<void> => {
  const db = getFirestore();
  await setDoc(
    doc(db, 'users', userId),
    {
      pushToken: token,
      latitude,
      longitude,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Clears/removes the push token and location details from the user's document in Firestore.
 */
export const clearUserPushToken = async (userId: string): Promise<void> => {
  const db = getFirestore();
  await setDoc(
    doc(db, 'users', userId),
    {
      pushToken: null,
      latitude: null,
      longitude: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
