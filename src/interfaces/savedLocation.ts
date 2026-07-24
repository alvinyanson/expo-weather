export interface SavedLocation {
  id: string;
  city: string;
  lat: number;
  lon: number;
  createdAt: number | null;
  userId: string;
  order?: number;
}

export interface SaveLocationInput {
  city: string;
  lat: number;
  lon: number;
}
