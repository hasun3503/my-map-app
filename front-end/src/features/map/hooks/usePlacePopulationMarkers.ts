import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getNearbyPopulation } from "@/services/populationService";

import type {
  PopulationItem,
} from "@/types/population";

import type {
  SearchPlace,
} from "../types/map";

interface UsePlacePopulationMarkersResult {
  populationByPlaceId: Record<
    string,
    PopulationItem | null
  >;
  isLoading: boolean;
}

function getNearestPopulation(
  items: PopulationItem[],
): PopulationItem | null {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort((left, right) => {
    return left.distance_m - right.distance_m;
  })[0];
}

export function usePlacePopulationMarkers(
  places: SearchPlace[],
): UsePlacePopulationMarkersResult {
  const cacheRef = useRef<
    Record<string, PopulationItem | null>
  >({});

  const [populationByPlaceId, setPopulationByPlaceId] =
    useState<Record<string, PopulationItem | null>>({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPopulationForPlaces() {
      if (places.length === 0) {
        setPopulationByPlaceId({});
        setIsLoading(false);

        return;
      }

      const uncachedPlaces = places.filter((place) => {
        return !(place.id in cacheRef.current);
      });

      if (uncachedPlaces.length === 0) {
        const visiblePopulation = places.reduce<
          Record<string, PopulationItem | null>
        >((result, place) => {
          result[place.id] =
            cacheRef.current[place.id] ?? null;

          return result;
        }, {});

        setPopulationByPlaceId(visiblePopulation);
        setIsLoading(false);

        return;
      }

      setIsLoading(true);

      const loadedEntries = await Promise.all(
        uncachedPlaces.map(async (place) => {
          try {
            const result = await getNearbyPopulation({
              latitude: place.y,
              longitude: place.x,
              radiusM: 1_500,
              limit: 1,
            });

            return [
              place.id,
              getNearestPopulation(result.items),
            ] as const;
          } catch {
            return [place.id, null] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      loadedEntries.forEach(([placeId, population]) => {
        cacheRef.current[placeId] = population;
      });

      const visiblePopulation = places.reduce<
        Record<string, PopulationItem | null>
      >((result, place) => {
        result[place.id] =
          cacheRef.current[place.id] ?? null;

        return result;
      }, {});

      setPopulationByPlaceId(visiblePopulation);
      setIsLoading(false);
    }

    void loadPopulationForPlaces();

    return () => {
      cancelled = true;
    };
  }, [places]);

  return {
    populationByPlaceId,
    isLoading,
  };
}