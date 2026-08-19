import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getNearbyPopulation,
} from "../services/populationService";

import type {
  NearbyPopulationResult,
} from "../types/population";


interface UsePopulationOptions {
  radiusM?: number;
  limit?: number;
}


interface UsePopulationResult {
  data: NearbyPopulationResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}


export function usePopulation(
  latitude?: number | null,
  longitude?: number | null,
  options: UsePopulationOptions = {},
): UsePopulationResult {
  const [data, setData] = useState<NearbyPopulationResult | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const radiusM = options.radiusM ?? 3000;
  const limit = options.limit ?? 5;

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
      const result = await getNearbyPopulation({
        latitude,
        longitude,
        radiusM,
        limit,
      });

      setData(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError
          : new Error("주변 인구 정보를 불러오지 못했습니다."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    latitude,
    longitude,
    radiusM,
    limit,
  ]);

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