export type CongestionLevel =
  | "relaxed"
  | "normal"
  | "slightly_crowded"
  | "crowded"
  | "unavailable";

export interface PopulationItem {
  area_code: string;
  area_name: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  population_min: number | null;
  population_max: number | null;
  congestion_level: CongestionLevel;
  congestion_message: string;
  measured_at: string | null;
}

export interface NearbyPopulationResult {
  latitude: number;
  longitude: number;
  radius_m: number;
  requested_at: string;
  items: PopulationItem[];
}
