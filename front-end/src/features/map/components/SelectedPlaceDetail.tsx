import type {
  PopulationItem,
} from "@/types/population";

import type {
  MapCoordinate,
  SearchPlace,
} from "../types/map";

interface SelectedPlaceDetailProps {
  selectedPlace: SearchPlace | null;
  center: MapCoordinate | null;
  population: PopulationItem | null;
  isPopulationLoading: boolean;
  populationError: Error | null;
}

function calculateDistanceM(
  from: MapCoordinate,
  to: MapCoordinate,
): number {
  const earthRadiusM = 6_371_000;

  const toRadians = (value: number) => {
    return (value * Math.PI) / 180;
  };

  const latitudeDifference = toRadians(to.y - from.y);
  const longitudeDifference = toRadians(to.x - from.x);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from.y)) *
      Math.cos(toRadians(to.y)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusM * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a),
  );
}

function formatDistance(distanceM: number): string {
  if (distanceM < 1_000) {
    return `${Math.round(distanceM)}m`;
  }

  return `${(distanceM / 1_000).toFixed(1)}km`;
}

function formatPopulation(
  minimum: number | null,
  maximum: number | null,
): string {
  if (minimum === null && maximum === null) {
    return "데이터 없음";
  }

  if (maximum === null || minimum === maximum) {
    return `${(minimum ?? 0).toLocaleString()}명`;
  }

  if (minimum === null) {
    return `최대 ${maximum.toLocaleString()}명`;
  }

  return `${minimum.toLocaleString()} ~ ${maximum.toLocaleString()}명`;
}

function formatMeasuredAt(value: string | null): string {
  if (!value) {
    return "측정 시각 없음";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")} 측정`;
}

function getCongestionMeta(level: string) {
  if (level === "relaxed") {
    return {
      label: "여유",
      color: "#35D7A2",
    };
  }

  if (level === "normal") {
    return {
      label: "보통",
      color: "#F6C744",
    };
  }

  if (level === "slightly_crowded") {
    return {
      label: "약간 붐빔",
      color: "#FF9B42",
    };
  }

  if (level === "crowded") {
    return {
      label: "붐빔",
      color: "#FF6574",
    };
  }

  return {
    label: "정보 없음",
    color: "#8D9AB0",
  };
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

export function SelectedPlaceDetail({
  selectedPlace,
  center,
  population,
  isPopulationLoading,
  populationError,
}: SelectedPlaceDetailProps) {
  if (!selectedPlace) {
    return (
      <section
        className="selected-place-detail"
        style={{
          alignItems: "center",
          background: "#0E1C34",
          border: "1px dashed #2B3D5A",
          borderRadius: 14,
          color: "#8391A9",
          display: "flex",
          justifyContent: "center",
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        지도 위 팻말 또는 우측 목록에서 장소를 선택하면
        <br />
        시설 정보와 주변 실시간 인구 정보를 표시합니다.
      </section>
    );
  }

  const distanceFromMapCenter = center
    ? calculateDistanceM(center, selectedPlace)
    : null;

  const naverMapSearchUrl =
    "https://map.naver.com/p/search/" +
    encodeURIComponent(selectedPlace.name);

  const congestion = population
    ? getCongestionMeta(population.congestion_level)
    : null;

  return (
    <section
      className="selected-place-detail"
      style={{
        background:
          "linear-gradient(135deg, #101F3B 0%, #0C1830 100%)",
        border: "1px solid #2E4265",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid #263958",
          display: "flex",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <span
          style={{
            alignItems: "center",
            background: "rgba(109, 50, 243, 0.18)",
            border: "1px solid rgba(142, 99, 255, 0.36)",
            borderRadius: 10,
            display: "flex",
            fontSize: 19,
            height: 38,
            justifyContent: "center",
            width: 38,
          }}
        >
          {getCategoryIcon(selectedPlace.category)}
        </span>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: "#A8B7D0",
              fontSize: 11,
              marginBottom: 3,
            }}
          >
            선택한 장소
          </div>

          <h2
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedPlace.name}
          </h2>
        </div>

        <a
          href={naverMapSearchUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            background: "#152744",
            border: "1px solid #30486D",
            borderRadius: 8,
            color: "#C5D4EB",
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            padding: "8px 10px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          네이버 지도
        </a>
      </div>

      <div className="selected-place-detail__content">
        <Metric
          label="시설 분류"
          value={selectedPlace.category}
        />

        <Metric
          label="지도 중심 거리"
          value={
            distanceFromMapCenter === null
              ? "계산 중"
              : formatDistance(distanceFromMapCenter)
          }
        />

        <Metric
          label="위도"
          value={selectedPlace.y.toFixed(6)}
        />

        <Metric
          label="경도"
          value={selectedPlace.x.toFixed(6)}
        />
      </div>

      <div className="selected-place-detail__address">
        <div
          style={{
            color: "#7385A4",
            fontSize: 11,
            marginBottom: 5,
          }}
        >
          도로명·지번 주소
        </div>

        <p
          style={{
            color: "#C7D3E6",
            fontSize: 13,
            lineHeight: 1.45,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={selectedPlace.address}
        >
          {selectedPlace.address}
        </p>
      </div>

      <div
        style={{
          borderTop: "1px solid #263958",
          padding: "12px 16px 14px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              color: "#DCE6F7",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            주변 실시간 유동인구
          </div>

          {congestion && (
            <span
              style={{
                background: `${congestion.color}1F`,
                border: `1px solid ${congestion.color}66`,
                borderRadius: 999,
                color: congestion.color,
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 8px",
              }}
            >
              {congestion.label}
            </span>
          )}
        </div>

        {isPopulationLoading && (
          <div
            style={{
              color: "#9EACC4",
              fontSize: 12,
            }}
          >
            선택 장소 주변의 유동인구를 불러오는 중입니다.
          </div>
        )}

        {!isPopulationLoading && populationError && (
          <div
            style={{
              color: "#FF9EAA",
              fontSize: 12,
            }}
          >
            유동인구 정보를 불러오지 못했습니다:{" "}
            {populationError.message}
          </div>
        )}

        {!isPopulationLoading &&
          !populationError &&
          !population && (
            <div
              style={{
                color: "#8391A9",
                fontSize: 12,
              }}
            >
              반경 1.5km 안에 실시간 유동인구 데이터가 없습니다.
            </div>
          )}

        {!isPopulationLoading &&
          !populationError &&
          population && (
            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
              }}
            >
              <Metric
                label="가장 가까운 인구 지점"
                value={population.area_name}
              />

              <Metric
                label="시설 기준 거리"
                value={formatDistance(population.distance_m)}
              />

              <Metric
                label="예상 인구"
                value={formatPopulation(
                  population.population_min,
                  population.population_max,
                )}
              />

              <div
                style={{
                  background: "#0B1830",
                  borderRadius: 10,
                  gridColumn: "1 / -1",
                  padding: 10,
                }}
              >
                <div
                  style={{
                    color: "#7385A4",
                    fontSize: 11,
                    marginBottom: 5,
                  }}
                >
                  혼잡 안내 · 측정 시각
                </div>

                <div
                  style={{
                    color: "#DCE6F7",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {population.congestion_message ||
                    "혼잡도 안내 정보가 없습니다."}
                  <br />
                  {formatMeasuredAt(population.measured_at)}
                </div>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="selected-place-detail__metric">
      <div className="selected-place-detail__metric-label">
        {label}
      </div>

      <strong className="selected-place-detail__metric-value">
        {value}
      </strong>
    </div>
  );
}