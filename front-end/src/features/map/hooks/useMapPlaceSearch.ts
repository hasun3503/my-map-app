import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCategoryLabel,
  PLACE_KEYWORDS,
} from "../constants/mapConstants";

import { searchLocalPlaces } from "../services/mapSearchService";

import type {
  LocalSearchItem,
  MapCoordinate,
  PlaceFilter,
  SearchPlace,
} from "../types/map";

type NaverMaps = any;

interface UseMapPlaceSearchOptions {
  activeFilter: PlaceFilter | null;
  center: MapCoordinate | null;
  isMapReady: boolean;
}

interface UseMapPlaceSearchResult {
  places: SearchPlace[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function getNaverMaps(): NaverMaps | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as any).naver?.maps ?? null;
}

function isWgs84(x: number, y: number): boolean {
  return x > 110 && x < 140 && y > 20 && y < 50;
}

function toWgs84(
  rawX: number,
  rawY: number,
  naverMaps: NaverMaps,
): MapCoordinate | null {
  if (Number.isNaN(rawX) || Number.isNaN(rawY)) {
    return null;
  }

  if (isWgs84(rawX, rawY)) {
    return { x: rawX, y: rawY };
  }

  if (Math.abs(rawX) > 10_000_000 && Math.abs(rawY) > 1_000_000) {
    const x = rawX / 10_000_000;
    const y = rawY / 10_000_000;

    if (isWgs84(x, y)) {
      return { x, y };
    }
  }

  try {
    const transCoord = naverMaps?.TransCoord;
    const point = naverMaps?.Point;

    if (transCoord?.fromTM128ToLatLng && point) {
      const latLng = transCoord.fromTM128ToLatLng(
        new point(rawX, rawY),
      );

      const x = latLng.lng();
      const y = latLng.lat();

      if (isWgs84(x, y)) {
        return { x, y };
      }
    }

    if (transCoord?.fromKATECToLatLng) {
      const latLng = transCoord.fromKATECToLatLng(rawX, rawY);

      const x = latLng.lng();
      const y = latLng.lat();

      if (isWgs84(x, y)) {
        return { x, y };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resolveRegion(
  center: MapCoordinate,
  naverMaps: NaverMaps,
): Promise<string> {
  const service = naverMaps?.Service;
  const latLng = naverMaps?.LatLng;

  if (!service?.reverseGeocode || !latLng) {
    return Promise.resolve("");
  }

  return new Promise((resolve) => {
    service.reverseGeocode(
      {
        coords: new latLng(center.y, center.x),
      },
      (status: any, response: any) => {
        if (status !== service.Status.OK || !response) {
          resolve("");
          return;
        }

        const result = response.v2 ?? response;
        const region = result.results?.[0]?.region;

        const area1 = String(region?.area1?.name ?? "");
        const area2 = String(region?.area2?.name ?? "");

        resolve(`${area1} ${area2}`.trim());
      },
    );
  });
}

function normalizePlace(
  item: LocalSearchItem,
  filter: PlaceFilter,
  naverMaps: NaverMaps,
): SearchPlace | null {
  const rawX = Number(item.mapx ?? item.x ?? item.lng);
  const rawY = Number(item.mapy ?? item.y ?? item.lat);

  const coordinate = toWgs84(rawX, rawY, naverMaps);

  if (!coordinate) {
    return null;
  }

  const name = String(item.title ?? "").replace(/<[^>]*>/g, "").trim();

  if (!name) {
    return null;
  }

  const address = String(
    item.roadAddress ?? item.address ?? "주소 정보 없음",
  );

  return {
    id: `${name}-${coordinate.x.toFixed(6)}-${coordinate.y.toFixed(6)}`,
    name,
    address,
    category: getCategoryLabel(filter),
    ...coordinate,
  };
}

export function useMapPlaceSearch({
  activeFilter,
  center,
  isMapReady,
}: UseMapPlaceSearchOptions): UseMapPlaceSearchResult {
  const [places, setPlaces] = useState<SearchPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortControllerRef.current?.abort();

    if (
      !activeFilter ||
      activeFilter === "Q&A" ||
      !center ||
      !isMapReady
    ) {
      setPlaces([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const naverMaps = getNaverMaps();
    const keywords = PLACE_KEYWORDS[activeFilter];

    if (!naverMaps || keywords.length === 0) {
      setPlaces([]);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const region = await resolveRegion(center, naverMaps);

      const queries = keywords.slice(0, 3).map((keyword) => {
        return region ? `${region} ${keyword}` : keyword;
      });

      const batches = await Promise.all(
        queries.map((query) => {
          return searchLocalPlaces(query, controller.signal);
        }),
      );

      if (controller.signal.aborted) {
        return;
      }

      const deduplicated = new Map<string, SearchPlace>();

      batches.flat().forEach((item) => {
        const place = normalizePlace(
          item,
          activeFilter,
          naverMaps,
        );

        if (!place) {
          return;
        }

        deduplicated.set(place.id, place);
      });

      setPlaces([...deduplicated.values()]);
    } catch (caughtError) {
      if (controller.signal.aborted) {
        return;
      }

      setPlaces([]);

      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error("장소 검색에 실패했습니다."),
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    activeFilter,
    center?.x,
    center?.y,
    isMapReady,
  ]);

  useEffect(() => {
    void refresh();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refresh]);

  return {
    places,
    isLoading,
    error,
    refresh,
  };
}