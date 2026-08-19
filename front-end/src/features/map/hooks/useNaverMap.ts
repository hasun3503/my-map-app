import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { DEFAULT_MAP_CENTER } from "../constants/mapConstants";

import type { MapCoordinate } from "../types/map";

type NaverMaps = any;
type NaverMapInstance = any;

interface UseNaverMapOptions {
  onIdle?: (center: MapCoordinate) => void;
}

interface UseNaverMapResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  map: NaverMapInstance | null;
  isReady: boolean;
  error: Error | null;
  moveTo: (coordinate: MapCoordinate, zoom?: number) => void;
  getCenter: () => MapCoordinate | null;
}

let naverMapScriptPromise: Promise<void> | null = null;

function getNaverMaps(): NaverMaps | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as any).naver?.maps ?? null;
}

function loadNaverMapScript(clientId: string): Promise<void> {
  const existingNaverMaps = getNaverMaps();

  if (existingNaverMaps) {
    return Promise.resolve();
  }

  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  naverMapScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      "naver-map-script",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), {
        once: true,
      });

      existingScript.addEventListener(
        "error",
        () => {
          reject(
            new Error("네이버 지도 스크립트를 불러오지 못했습니다."),
          );
        },
        { once: true },
      );

      return;
    }

    const script = document.createElement("script");

    script.id = "naver-map-script";
    script.async = true;
    script.type = "text/javascript";
    script.src =
      "https://oapi.map.naver.com/openapi/v3/maps.js" +
      `?ncpKeyId=${encodeURIComponent(clientId)}` +
      "&submodules=geocoder";

    script.onload = () => resolve();

    script.onerror = () => {
      naverMapScriptPromise = null;

      reject(
        new Error("네이버 지도 스크립트를 불러오지 못했습니다."),
      );
    };

    document.head.appendChild(script);
  });

  return naverMapScriptPromise;
}

export function useNaverMap({
  onIdle,
}: UseNaverMapOptions = {}): UseNaverMapResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const idleListenerRef = useRef<any>(null);
  const onIdleRef = useRef(onIdle);

  const [map, setMap] = useState<NaverMapInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    let isUnmounted = false;

    const clientId =
      process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

    async function initializeMap() {
      if (!clientId) {
        throw new Error(
          "EXPO_PUBLIC_NAVER_MAP_CLIENT_ID 환경 변수가 없습니다.",
        );
      }

      await loadNaverMapScript(clientId);

      if (isUnmounted || mapRef.current || !containerRef.current) {
        return;
      }

      const naverMaps = getNaverMaps();

      if (!naverMaps?.Map || !naverMaps?.LatLng) {
        throw new Error("네이버 지도 SDK 초기화에 실패했습니다.");
      }

      const initialCenter = new naverMaps.LatLng(
        DEFAULT_MAP_CENTER.latitude,
        DEFAULT_MAP_CENTER.longitude,
      );

      const nextMap = new naverMaps.Map(containerRef.current, {
        center: initialCenter,
        zoom: DEFAULT_MAP_CENTER.zoom,
        minZoom: DEFAULT_MAP_CENTER.minZoom,
        maxZoom: DEFAULT_MAP_CENTER.maxZoom,
      });

      mapRef.current = nextMap;

      idleListenerRef.current = naverMaps.Event.addListener(
        nextMap,
        "idle",
        () => {
          const center = nextMap.getCenter();

          onIdleRef.current?.({
            x: center.lng(),
            y: center.lat(),
          });
        },
      );

      if (!isUnmounted) {
        setMap(nextMap);
        setIsReady(true);

        onIdleRef.current?.({
          x: initialCenter.lng(),
          y: initialCenter.lat(),
        });
      }
    }

    initializeMap().catch((caughtError) => {
      if (isUnmounted) {
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error("지도를 초기화하지 못했습니다."),
      );
    });

    return () => {
      isUnmounted = true;

      const naverMaps = getNaverMaps();

      if (idleListenerRef.current && naverMaps?.Event) {
        naverMaps.Event.removeListener(idleListenerRef.current);
      }

      idleListenerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  const getCenter = useCallback((): MapCoordinate | null => {
    if (!mapRef.current) {
      return null;
    }

    const center = mapRef.current.getCenter();

    return {
      x: center.lng(),
      y: center.lat(),
    };
  }, []);

  const moveTo = useCallback(
    (coordinate: MapCoordinate, zoom?: number) => {
      const naverMaps = getNaverMaps();

      if (!mapRef.current || !naverMaps?.LatLng) {
        return;
      }

      const latLng = new naverMaps.LatLng(
        coordinate.y,
        coordinate.x,
      );

      if (typeof zoom === "number") {
        mapRef.current.morph(latLng, zoom);
        return;
      }

      mapRef.current.panTo(latLng);
    },
    [],
  );

  return {
    containerRef,
    map,
    isReady,
    error,
    moveTo,
    getCenter,
  };
}