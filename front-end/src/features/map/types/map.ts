export type PlaceFilter =
  | "주민센터"
  | "운동센터"
  | "지역사업 찾기"
  | "공원"
  | "지하철"
  | "Q&A";

export type MapActionFilter = PlaceFilter | "정부 24";

export type DensityLevel =
  | "low"
  | "medium"
  | "high"
  | "veryHigh";

export interface MapCoordinate {
  x: number;
  y: number;
}

export interface SearchPlace extends MapCoordinate {
  id: string;
  name: string;
  address: string;
  category: string;
}

export interface MapPlace extends MapCoordinate {
  name: string;
  address: string;
  category: string;
}

export interface FilterSummary {
  filter: PlaceFilter;
  count: number;
}

export interface DensityArea {
  id: string;
  name: string;
  level: DensityLevel;
  population: number;
  coords: MapCoordinate[];
  center?: MapCoordinate;
  query?: string;
  radiusMeters?: number;
}

export interface ClickedDensityArea {
  id: string;
  name: string;
  level: DensityLevel;
  population: number;
}

export interface FilterInfo {
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface LocalSearchItem {
  title?: string;
  address?: string;
  roadAddress?: string;
  mapx?: string | number;
  mapy?: string | number;
  x?: string | number;
  y?: string | number;
  lng?: string | number;
  lat?: string | number;
}

export interface LocalSearchResponse {
  items?: LocalSearchItem[];
  total?: number;
  error?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}