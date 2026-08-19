import { apiGet } from "./apiClient";
import type { NearbyPopulationResult } from "../types/population";

export interface PopulationQuery {
  latitude: number;
  longitude: number;
  radiusM?: number;
  limit?: number;
}

const DEFAULT_RADIUS_M = 3000;
const DEFAULT_LIMIT = 5;

export async function getNearbyPopulation(
  query: PopulationQuery,
): Promise<NearbyPopulationResult> {
  const params = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
    radius_m: String(query.radiusM ?? DEFAULT_RADIUS_M),
    limit: String(query.limit ?? DEFAULT_LIMIT),
  });

  return apiGet<NearbyPopulationResult>(
    `/population/nearby?${params.toString()}`,
  );
}
