export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface MapMarkerData {
  id: string; // 'current-location' for GPS, or the SavedLocation.id
  latitude: number;
  longitude: number;
  city: string;
  isCurrentLocation: boolean;
}
