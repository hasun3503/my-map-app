import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getWeather,
} from "../services/weatherService";

import type {
  WeatherResult,
} from "../types/weather";


interface UseWeatherResult {
  data: WeatherResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}


export function useWeather(
  latitude?: number | null,
  longitude?: number | null,
): UseWeatherResult {
  const [data, setData] = useState<WeatherResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (latitude === null || latitude === undefined) {
      return;
    }

    if (longitude === null || longitude === undefined) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getWeather({
        latitude,
        longitude,
      });

      setData(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError
          : new Error("날씨 정보를 불러오지 못했습니다."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}