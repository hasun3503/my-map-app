import { useEffect, useRef } from "react";

import type { SearchPlace } from "../types/map";

import type {
  PopulationItem,
} from "@/types/population";
type NaverMapInstance = any;

interface UseMapMarkersOptions {
  map: NaverMapInstance | null;
  places: SearchPlace[];
  selectedPlace: SearchPlace | null;
  populationByPlaceId: Record<
    string,
    PopulationItem | null
  >;
  onSelectPlace: (place: SearchPlace) => void;
}

function getNaverMaps(): any | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as any).naver?.maps ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCategoryIcon(category: string): string {
  if (category === "주민센터") {
    return "🏛";
  }

  if (category === "운동센터") {
    return "🏃";
  }

  if (category === "지역사업") {
    return "💼";
  }

  if (category === "공원") {
    return "🌳";
  }

  if (category === "지하철역") {
    return "🚇";
  }

  if (category === "민원/Q&A") {
    return "💬";
  }

  return "📍";
}

function getPopulationMarkerMeta(
  population: PopulationItem | null,
) {
  if (!population) {
    return {
      color: "#334763",
      label: "데이터 없음",
    };
  }

  if (population.congestion_level === "relaxed") {
    return {
      color: "#35D7A2",
      label: "여유",
    };
  }

  if (population.congestion_level === "normal") {
    return {
      color: "#F6C744",
      label: "보통",
    };
  }

  if (
    population.congestion_level === "slightly_crowded"
  ) {
    return {
      color: "#FF9B42",
      label: "약간 붐빔",
    };
  }

  if (population.congestion_level === "crowded") {
    return {
      color: "#FF6574",
      label: "붐빔",
    };
  }

  return {
    color: "#8D9AB0",
    label: "정보 없음",
  };
}

function createMarkerContent(
  place: SearchPlace,
  isSelected: boolean,
  population: PopulationItem | null,
): string {
  const density = getPopulationMarkerMeta(population);

  const borderColor = isSelected
    ? "#B99AFF"
    : "rgba(255, 255, 255, 0.82)";

  const shadowColor = isSelected
    ? "rgba(151, 93, 255, 0.50)"
    : `${density.color}66`;

  return `
    <div
      style="
        align-items:center;
        background:${density.color};
        border:2px solid ${borderColor};
        border-radius:999px;
        box-shadow:0 7px 18px ${shadowColor};
        color:#FFFFFF;
        display:flex;
        font-family:Arial, sans-serif;
        font-size:12px;
        font-weight:700;
        gap:6px;
        max-width:196px;
        padding:8px 11px;
        text-shadow:0 1px 2px rgba(0, 0, 0, 0.35);
        white-space:nowrap;
      "
    >
      <span style="font-size:14px; line-height:1;">
        ${getCategoryIcon(place.category)}
      </span>

      <span
        style="
          max-width:115px;
          overflow:hidden;
          text-overflow:ellipsis;
        "
      >
        ${escapeHtml(place.name)}
      </span>

      <span
        style="
          background:rgba(0, 0, 0, 0.17);
          border-radius:999px;
          font-size:10px;
          padding:3px 6px;
        "
      >
        ${density.label}
      </span>
    </div>
  `;
}

export function useMapMarkers({
  map,
  places,
  selectedPlace,
  populationByPlaceId,
  onSelectPlace,
}: UseMapMarkersOptions): void {
  const markersRef = useRef<any[]>([]);
  const listenersRef = useRef<any[]>([]);

  useEffect(() => {
    const naverMaps = getNaverMaps();

    function clearMarkers() {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });

      markersRef.current = [];

      if (naverMaps?.Event) {
        listenersRef.current.forEach((listener) => {
          naverMaps.Event.removeListener(listener);
        });
      }

      listenersRef.current = [];
    }

    if (!map || !naverMaps?.Marker || !naverMaps?.LatLng) {
      clearMarkers();
      return clearMarkers;
    }

    clearMarkers();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const population = populationByPlaceId[place.id] ?? null;    

      const marker = new naverMaps.Marker({
        map,
        position: new naverMaps.LatLng(place.y, place.x),
        title: place.name,
        zIndex: isSelected ? 30 : 20,
        icon: {
          content: createMarkerContent(place, isSelected, population,),
          anchor: new naverMaps.Point(90, 42),
        },
      });

      const listener = naverMaps.Event.addListener(
        marker,
        "click",
        () => {
          onSelectPlace(place);
        },
      );

      markersRef.current.push(marker);
      listenersRef.current.push(listener);
    });

    return clearMarkers;
  }, [ map, places, selectedPlace?.id, populationByPlaceId, onSelectPlace,]);
}