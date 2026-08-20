export type FacilityCategory =
  | "all"
  | "community-center"
  | "sports-center"
  | "local-project"
  | "park"
  | "subway"
  | "government24"
  | "qna";

export type DensityLevel =
  | "relaxed"
  | "normal"
  | "crowded"
  | "very-crowded"
  | "unknown";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapCenter extends MapCoordinate {
  zoom?: number;
  address?: string;
}

export interface Facility extends MapCoordinate {
  id: string;
  name: string;
  category: Exclude<FacilityCategory, "all">;
  address: string;
  description?: string;
  distanceM?: number;
  externalUrl?: string;
}

export interface PopulationStatus {
  level: DensityLevel;
  min: number | null;
  max: number | null;
  updatedAt?: string;
  sourceName?: string;
}

export interface WeatherStatus {
  temperature: number;
  condition: string;
  humidity: number;
}

export interface FacilityDetail extends Facility {
  population?: PopulationStatus;
  weather?: WeatherStatus;
}

export interface FacilityCategoryOption {
  id: FacilityCategory;
  label: string;
  markerLabel: string;
  icon: string;
  searchKeyword?: string;
}

export interface DensityMeta {
  label: string;
  color: string;
  backgroundColor: string;
}

export interface FacilitySearchParams {
  category: FacilityCategory;
  center: MapCoordinate;
  radiusM?: number;
}