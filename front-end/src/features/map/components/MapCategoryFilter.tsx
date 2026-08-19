import {
  GOVERNMENT_24_URL,
  MAP_FILTERS,
} from "../constants/mapConstants";

import type {
  MapActionFilter,
  PlaceFilter,
} from "../types/map";

interface MapCategoryFilterProps {
  activeFilter: PlaceFilter | null;
  onChangeFilter: (filter: PlaceFilter | null) => void;
}

function isPlaceFilter(
  filter: MapActionFilter,
): filter is PlaceFilter {
  return filter !== "정부 24";
}

export function MapCategoryFilter({
  activeFilter,
  onChangeFilter,
}: MapCategoryFilterProps) {
  const handleClick = (filter: MapActionFilter) => {
    if (filter === "정부 24") {
      window.open(
        GOVERNMENT_24_URL,
        "_blank",
        "noopener,noreferrer",
      );

      return;
    }

    const nextFilter =
      activeFilter === filter ? null : filter;

    onChangeFilter(nextFilter);
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {MAP_FILTERS.map((filter) => {
        const selected =
          isPlaceFilter(filter) && activeFilter === filter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => handleClick(filter)}
            style={{
              background: selected
                ? "#6D32F3"
                : "#101E36",
              border: selected
                ? "1px solid #8E63FF"
                : "1px solid #263856",
              borderRadius: 999,
              color: selected ? "#FFFFFF" : "#BBC9E1",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1,
              padding: "10px 14px",
              transition: "all 160ms ease",
            }}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}