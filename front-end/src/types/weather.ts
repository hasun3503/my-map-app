export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "rain_snow"
  | "snow"
  | "shower"
  | "unknown";

export interface CurrentWeather {
  observed_at: string | null;
  temperature_c: number | null;
  humidity_percent: number | null;
  wind_speed_mps: number | null;
  wind_direction_deg: number | null;
  feels_like_c: number | null;
  condition: WeatherCondition;
}

export interface HourlyWeather {
  at: string;
  temperature_c: number | null;
  humidity_percent: number | null;
  wind_speed_mps: number | null;
  condition: WeatherCondition;
}

export interface DailyWeather {
  date: string;
  min_temperature_c: number | null;
  max_temperature_c: number | null;
  condition: WeatherCondition | null;
}

export interface WeeklyWeather {
  date: string;
  condition: WeatherCondition | null;
  min_temperature_c: number | null;
  max_temperature_c: number | null;
  rain_probability_percent: number | null;
  source: "mid_term";
}

export interface WeatherResult {
  latitude: number;
  longitude: number;
  grid_x: number;
  grid_y: number;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  weekly: WeeklyWeather[];
}