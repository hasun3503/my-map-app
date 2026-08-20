import {
  useCallback,
  useEffect,
  useState,
} from "react";


export interface CurrentLocation {
  latitude: number;
  longitude: number;
}


interface UseCurrentLocationResult {
  location: CurrentLocation | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}


export function useCurrentLocation(): UseCurrentLocationResult {
  const [location, setLocation] = useState<CurrentLocation | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    if (typeof navigator === "undefined") {
      setIsLoading(false);
      setError(
        new Error(
          "브라우저 위치 정보를 사용할 수 없는 환경입니다.",
        ),
      );

      return;
    }

    if (!navigator.geolocation) {
      setIsLoading(false);
      setError(
        new Error(
          "이 브라우저는 위치 정보를 지원하지 않습니다.",
        ),
      );

      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setIsLoading(false);
      },
      (positionError) => {
        setError(
          new Error(
            `현재 위치를 가져오지 못했습니다: ${positionError.message}`,
          ),
        );

        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    location,
    isLoading,
    error,
    refresh,
  };
}