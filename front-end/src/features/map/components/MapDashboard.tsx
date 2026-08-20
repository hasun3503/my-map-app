import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { DENSITY_DOT_COLORS } from "../constants/mapConstants";
import { useMapPlaceSearch } from "../hooks/useMapPlaceSearch";

import type {
  MapCoordinate,
  PlaceFilter,
  SearchPlace,
} from "../types/map";

import { MapCategoryFilter } from "./MapCategoryFilter";
import { NaverMapCanvas } from "./NaverMapCanvas";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import { SelectedPlaceDetail } from "./SelectedPlaceDetail";

import "./mapDashboard.css";
import { useSelectedPlacePopulation } from "../hooks/useSelectedPlacePopulation";

import { usePlacePopulationMarkers } from "../hooks/usePlacePopulationMarkers";

const LEGEND_ITEMS = [
  { label: "여유", color: DENSITY_DOT_COLORS.low },
  { label: "보통", color: DENSITY_DOT_COLORS.medium },
  { label: "혼잡", color: DENSITY_DOT_COLORS.high },
  { label: "매우 혼잡", color: DENSITY_DOT_COLORS.veryHigh },
];

export function MapDashboard() {
  const [activeFilter, setActiveFilter] =
    useState<PlaceFilter | null>(null);

  const [center, setCenter] =
    useState<MapCoordinate | null>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<SearchPlace | null>(null);

  const {
    places,
    isLoading,
    error,
  } = useMapPlaceSearch({
    activeFilter,
    center,
    isMapReady: center !== null,
  });

  const {
    populationByPlaceId,
    } = usePlacePopulationMarkers(places);

  const {
    nearestPopulation,
    isLoading: isSelectedPopulationLoading,
    error: selectedPopulationError,
    } = useSelectedPlacePopulation(selectedPlace);

  useEffect(() => {
    setSelectedPlace(null);
  }, [activeFilter]);

  const handleChangeFilter = useCallback(
    (filter: PlaceFilter | null) => {
      setActiveFilter(filter);
    },
    [],
  );

  const handleCenterChange = useCallback(
    (nextCenter: MapCoordinate) => {
      setCenter(nextCenter);
    },
    [],
  );

  const handleSelectPlace = useCallback(
    (place: SearchPlace) => {
      setSelectedPlace(place);
    },
    [],
  );

  return (
    <main className="map-dashboard">
      <section className="map-dashboard__main-panel">
        <header className="map-dashboard__header">
          <div className="map-dashboard__heading-row">
            <div>
              <h1 className="map-dashboard__title">
                실시간 유동인구 지도
              </h1>

              <p className="map-dashboard__description">
                지도 중심 주변의 생활 시설을 검색합니다.
              </p>
            </div>

            <div className="map-dashboard__legend">
              {LEGEND_ITEMS.map((item) => (
                <span
                  key={item.label}
                  className="map-dashboard__legend-item"
                >
                  <span
                    className="map-dashboard__legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <MapCategoryFilter
            activeFilter={activeFilter}
            onChangeFilter={handleChangeFilter}
          />
        </header>

        <div className="map-dashboard__map-area">
          <NaverMapCanvas
            places={places}
            selectedPlace={selectedPlace}
            populationByPlaceId={populationByPlaceId}
            onCenterChange={handleCenterChange}
            onSelectPlace={handleSelectPlace}
            />
        </div>

        <div className="map-dashboard__detail-area">
          <SelectedPlaceDetail
            selectedPlace={selectedPlace}
            center={center}
            population={nearestPopulation}
            isPopulationLoading={isSelectedPopulationLoading}
            populationError={selectedPopulationError}
            />
        </div>
      </section>

      <div className="map-dashboard__side-panel">
        <PlaceDetailPanel
          activeFilter={activeFilter}
          places={places}
          selectedPlace={selectedPlace}
          isLoading={isLoading}
          error={error}
          onSelectPlace={handleSelectPlace}
        />
      </div>
    </main>
  );
}