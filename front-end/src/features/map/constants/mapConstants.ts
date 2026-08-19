import type {
  DensityLevel,
  FilterInfo,
  MapActionFilter,
  PlaceFilter,
} from "../types/map";

export const MAP_FILTERS: MapActionFilter[] = [
  "주민센터",
  "운동센터",
  "지역사업 찾기",
  "공원",
  "지하철",
  "정부 24",
  "Q&A",
];

export const PLACE_KEYWORDS: Record<PlaceFilter, string[]> = {
  "주민센터": [
    "주민센터",
    "행정복지센터",
    "주민자치센터",
  ],
  "운동센터": [
    "체육관",
    "스포츠센터",
    "구민체육센터",
  ],
  "지역사업 찾기": [
    "일자리센터",
    "평생학습센터",
    "사회적경제지원센터",
  ],
  "공원": [
    "공원",
    "근린공원",
    "도시숲",
  ],
  "지하철": [
    "지하철역",
    "전철역",
  ],
  "Q&A": [],
};

export const FILTER_INFO: Record<PlaceFilter, FilterInfo> = {
  "주민센터": {
    title: "주민센터 인근 정보",
    subtitle: "주민센터 운영 시간 안내 및 생활민원 지원 가능",
    timestamp: "현재 지도 기준 주변 시설",
  },
  "운동센터": {
    title: "운동센터 인근 정보",
    subtitle: "체육시설, 운동 프로그램, 이용 요금 안내",
    timestamp: "현재 지도 기준 주변 시설",
  },
  "지역사업 찾기": {
    title: "지역사업 정보",
    subtitle:
      "지역 커뮤니티 지원사업 및 참여 가능 프로그램",
    timestamp: "현재 지도 기준 주변 시설",
  },
  "공원": {
    title: "공원 인근 정보",
    subtitle: "산책로, 휴식 공간, 주변 편의시설 정보",
    timestamp: "현재 지도 기준 주변 시설",
  },
  "지하철": {
    title: "지하철역 정보",
    subtitle:
      "주변 지하철역 이동 편의 및 역세권 정보를 제공합니다.",
    timestamp: "현재 지도 기준 주변 시설",
  },
  "Q&A": {
    title: "Q&A 정보",
    subtitle: "자주 묻는 질문과 민원 처리 안내",
    timestamp: "카테고리를 선택해 안내를 확인하세요.",
  },
};

export const DENSITY_LABELS: Record<DensityLevel, string> = {
  low: "여유",
  medium: "보통",
  high: "혼잡",
  veryHigh: "매우 혼잡",
};

export const DENSITY_COLOR_MAP: Record<DensityLevel, string> = {
  low: "rgba(63, 185, 80, 0.45)",
  medium: "rgba(246, 183, 60, 0.45)",
  high: "rgba(242, 139, 48, 0.45)",
  veryHigh: "rgba(229, 72, 77, 0.45)",
};

export const DENSITY_DOT_COLORS: Record<DensityLevel, string> = {
  low: "#3FB950",
  medium: "#F6B73C",
  high: "#F28B30",
  veryHigh: "#E5484D",
};

export const DEFAULT_MAP_CENTER = {
  latitude: 37.498095,
  longitude: 127.02761,
  zoom: 13,
  minZoom: 10,
  maxZoom: 19,
} as const;

export const GOVERNMENT_24_URL = "https://plus.gov.kr/";

export function getCategoryLabel(filter: PlaceFilter): string {
  switch (filter) {
    case "주민센터":
      return "주민센터";

    case "운동센터":
      return "운동센터";

    case "지역사업 찾기":
      return "지역사업";

    case "공원":
      return "공원";

    case "지하철":
      return "지하철역";

    case "Q&A":
      return "민원/Q&A";
  }
}