import { FILTER_INFO } from "../constants/mapConstants";

import type {
  PlaceFilter,
  SearchPlace,
} from "../types/map";

interface PlaceDetailPanelProps {
  activeFilter: PlaceFilter | null;
  places: SearchPlace[];
  selectedPlace: SearchPlace | null;
  isLoading: boolean;
  error: Error | null;
  onSelectPlace: (place: SearchPlace) => void;
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

function EmptyPanel() {
  return (
    <div
      style={{
        alignItems: "center",
        color: "#8391A9",
        display: "flex",
        flex: 1,
        fontSize: 14,
        justifyContent: "center",
        lineHeight: 1.6,
        padding: 28,
        textAlign: "center",
      }}
    >
      상단 카테고리를 선택하면
      <br />
      현재 지도 주변의 실제 시설 정보를 표시합니다.
    </div>
  );
}

export function PlaceDetailPanel({
  activeFilter,
  places,
  selectedPlace,
  isLoading,
  error,
  onSelectPlace,
}: PlaceDetailPanelProps) {
  const filterInfo = activeFilter
    ? FILTER_INFO[activeFilter]
    : null;

  return (
    <aside
      style={{
        background: "#09162B",
        border: "1px solid #1C2C49",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        padding: 24,
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #1D2C47",
          paddingBottom: 18,
        }}
      >
        <h2
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            margin: 0,
          }}
        >
          지역별 현황
        </h2>

        <p
          style={{
            color: "#71809A",
            fontSize: 13,
            margin: "8px 0 0",
          }}
        >
          {filterInfo?.subtitle ??
            "지도 중심 주변 장소를 기준으로 표시합니다."}
        </p>
      </header>

      {!activeFilter && <EmptyPanel />}

      {activeFilter === "Q&A" && (
        <div
          style={{
            alignItems: "center",
            color: "#9EACC4",
            display: "flex",
            flex: 1,
            fontSize: 14,
            justifyContent: "center",
            lineHeight: 1.7,
            padding: 28,
            textAlign: "center",
          }}
        >
          Q&A 메뉴는 추후 자주 묻는 질문,
          <br />
          민원 안내, 공공 서비스 안내를
          <br />
          제공하는 패널로 연결합니다.
        </div>
      )}

      {activeFilter &&
        activeFilter !== "Q&A" &&
        isLoading && (
          <div
            style={{
              alignItems: "center",
              color: "#9EACC4",
              display: "flex",
              flex: 1,
              fontSize: 14,
              justifyContent: "center",
            }}
          >
            주변 시설을 검색하는 중입니다.
          </div>
        )}

      {activeFilter &&
        activeFilter !== "Q&A" &&
        !isLoading &&
        error && (
          <div
            style={{
              color: "#FF9EAA",
              fontSize: 13,
              lineHeight: 1.6,
              paddingTop: 20,
            }}
          >
            장소 정보를 불러오지 못했습니다.
            <br />
            {error.message}
          </div>
        )}

      {activeFilter &&
        activeFilter !== "Q&A" &&
        !isLoading &&
        !error &&
        places.length === 0 && (
          <div
            style={{
              alignItems: "center",
              color: "#8391A9",
              display: "flex",
              flex: 1,
              fontSize: 14,
              justifyContent: "center",
              lineHeight: 1.6,
              padding: 28,
              textAlign: "center",
            }}
          >
            현재 지도 범위에서
            <br />
            검색된 시설이 없습니다.
          </div>
        )}

      {activeFilter &&
        activeFilter !== "Q&A" &&
        !isLoading &&
        !error &&
        places.length > 0 && (
          <>
            <div
              style={{
                color: "#8391A9",
                fontSize: 12,
                padding: "16px 0 10px",
              }}
            >
              현재 지도 기준 {places.length}개 장소
            </div>

            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                gap: 10,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: 2,
              }}
            >
              {places.map((place) => {
                const selected =
                  selectedPlace?.id === place.id;

                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    style={{
                      background: selected
                        ? "rgba(109, 50, 243, 0.16)"
                        : "#0E1C34",
                      border: selected
                        ? "1px solid #7744EC"
                        : "1px solid #1C2D4A",
                      borderRadius: 14,
                      color: "#FFFFFF",
                      cursor: "pointer",
                      padding: 14,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        alignItems: "center",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          alignItems: "center",
                          background: selected
                            ? "rgba(124, 58, 237, 0.24)"
                            : "rgba(52, 72, 108, 0.36)",
                          borderRadius: 10,
                          display: "flex",
                          fontSize: 19,
                          height: 36,
                          justifyContent: "center",
                          width: 36,
                        }}
                      >
                        {getCategoryIcon(place.category)}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          flex: 1,
                          flexDirection: "column",
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            color: "#F8FAFF",
                            fontSize: 14,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {place.name}
                        </strong>

                        <span
                          style={{
                            color: "#7E8DA8",
                            fontSize: 12,
                            marginTop: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {place.address}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPlace && (
              <section
                style={{
                  background: "#0E1C34",
                  border: "1px solid #2B3E60",
                  borderRadius: 14,
                  marginTop: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    color: "#AEBBD1",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  선택한 장소
                </div>

                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: 16,
                  }}
                >
                  {selectedPlace.name}
                </strong>

                <div
                  style={{
                    color: "#AEBBD1",
                    fontSize: 13,
                    lineHeight: 1.55,
                    marginTop: 7,
                  }}
                >
                  {selectedPlace.category}
                  <br />
                  {selectedPlace.address}
                </div>
              </section>
            )}
          </>
        )}
    </aside>
  );
}