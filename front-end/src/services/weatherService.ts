import { apiGet } from "./apiClient";
import type { WeatherResult } from "../types/weather";

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export async function getWeather(
  coordinates: WeatherCoordinates,
): Promise<WeatherResult> {
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });

  return apiGet<WeatherResult>(
    `/weather/current?${query.toString()}`,
  );
}
