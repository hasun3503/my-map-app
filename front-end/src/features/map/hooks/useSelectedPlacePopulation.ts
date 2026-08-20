import { useMemo } from "react";

import { usePopulation } from "@/hooks/usePopulation";

import type {
  PopulationItem,
} from "@/types/population";

import type {
  SearchPlace,
} from "../types/map";

interface UseSelectedPlacePopulationResult {
  nearestPopulation: PopulationItem | null;
  nearbyPopulation: PopulationItem[];
  isLoading: boolean;
  error: Error | null;
}

export function useSelectedPlacePopulation(
  selectedPlace: SearchPlace | null,
): UseSelectedPlacePopulationResult {
  const {
    data,
    isLoading,
    error,
  } = usePopulation(
    selectedPlace?.y,
    selectedPlace?.x,
    {
      radiusM: 1_500,
      limit: 5,
    },
  );

  const nearbyPopulation = selectedPlace
    ? data?.items ?? []
    : [];

  const nearestPopulation = useMemo(() => {
    if (!selectedPlace || nearbyPopulation.length === 0) {
      return null;
    }

    return [...nearbyPopulation].sort((left, right) => {
      return left.distance_m - right.distance_m;
    })[0];
  }, [nearbyPopulation, selectedPlace]);

  return {
    nearestPopulation,
    nearbyPopulation,
    isLoading: Boolean(selectedPlace) && isLoading,
    error: selectedPlace ? error : null,
  };
}