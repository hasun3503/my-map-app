import { useCallback } from "react";

import { useMapMarkers } from "../hooks/useMapMarkers";
import { useNaverMap } from "../hooks/useNaverMap";

import type {
  MapCoordinate,
  SearchPlace,
} from "../types/map";

import type {
  PopulationItem,
} from "@/types/population";

interface NaverMapCanvasProps {
  places: SearchPlace[];
  selectedPlace: SearchPlace | null;
  populationByPlaceId: Record<
    string,
    PopulationItem | null
  >;
  onCenterChange: (center: MapCoordinate) => void;
  onSelectPlace: (place: SearchPlace) => void;
}

export function NaverMapCanvas({
  places,
  selectedPlace,
  populationByPlaceId,
  onCenterChange,
  onSelectPlace,
}: NaverMapCanvasProps) {
  const {
    containerRef,
    map,
    isReady,
    error,
    moveTo,
  } = useNaverMap({
    onIdle: onCenterChange,
  });

  useMapMarkers({
    map,
    places,
    selectedPlace,
    populationByPlaceId,
    onSelectPlace,
    });

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      window.alert("현재 위치 기능을 지원하지 않는 브라우저입니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        moveTo({
          x: position.coords.longitude,
          y: position.coords.latitude,
        }, 15);
      },
      () => {
        window.alert(
          "현재 위치를 가져오지 못했습니다. 위치 권한을 확인해 주세요.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );
  }, [moveTo]);

  return (
    <div
      style={{
        background: "#071225",
        border: "1px solid #1D2B45",
        borderRadius: 14,
        height : "100%" ,
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
      />

      {!isReady && !error && (
        <div
          style={{
            alignItems: "center",
            background: "rgba(3, 11, 30, 0.86)",
            color: "#C6D3EA",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            position: "absolute",
          }}
        >
          지도를 불러오는 중입니다.
        </div>
      )}

      {error && (
        <div
          style={{
            alignItems: "center",
            background: "rgba(3, 11, 30, 0.92)",
            color: "#FF9EAA",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            padding: 24,
            position: "absolute",
            textAlign: "center",
          }}
        >
          {error.message}
        </div>
      )}

      {isReady && (
        <button
          type="button"
          onClick={handleCurrentLocation}
          aria-label="현재 위치로 이동"
          style={{
            alignItems: "center",
            background: "#0C1930",
            border: "1px solid #2A3C5E",
            borderRadius: 10,
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            fontSize: 20,
            height: 42,
            justifyContent: "center",
            position: "absolute",
            right: 16,
            top: 16,
            width: 42,
          }}
        >
          ⌖
        </button>
      )}

      {isReady && places.length === 0 && (
        <div
          style={{
            background: "rgba(12, 25, 48, 0.9)",
            border: "1px solid #2A3C5E",
            borderRadius: 10,
            bottom: 16,
            color: "#C6D3EA",
            fontSize: 13,
            left: 16,
            padding: "10px 12px",
            position: "absolute",
          }}
        >
          카테고리를 선택하면 주변 시설 팻말을 표시합니다.
        </div>
      )}
    </div>
  );
}