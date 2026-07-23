export interface WeatherHistoryRow {
  id: number;
  fetched_at: string; // ISO-8601 UTC
  latitude: number;
  longitude: number;
  city: string;
  temperature: number;
  weather_code: number;
  humidity: number;
  wind_speed: number;
  pressure: number | null;
  temp_max: number;
  temp_min: number;
  temperature_unit: 'celsius' | 'fahrenheit';
  wind_speed_unit: 'kmh' | 'mph';
}

export interface DailyWeatherSummary {
  date: string; // 'YYYY-MM-DD' derived from fetched_at UTC date
  temp_min: number;
  temp_max: number;
  /** Raw snapshot rows for this day (aliased as `data` for SectionList compatibility). */
  data: WeatherHistoryRow[];
  snapshots: WeatherHistoryRow[];
}
