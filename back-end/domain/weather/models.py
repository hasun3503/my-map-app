from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class CurrentWeather:
    observed_at: datetime | None
    temperature_c: float | None
    humidity_percent: float | None
    wind_speed_mps: float | None
    wind_direction_deg: float | None
    feels_like_c: float | None
    condition: str


@dataclass
class HourlyWeather:
    at: datetime
    temperature_c: float | None
    humidity_percent: float | None
    wind_speed_mps: float | None
    condition: str


@dataclass
class DailyWeather:
    date: date
    min_temperature_c: float | None
    max_temperature_c: float | None
    condition: str | None = None


@dataclass
class WeeklyWeather:
    date: date
    condition: str | None
    min_temperature_c: float | None
    max_temperature_c: float | None
    rain_probability_percent: int | None = None
    source: str = "mid_term"


@dataclass
class WeatherResult:
    latitude: float
    longitude: float
    grid_x: int
    grid_y: int
    current: CurrentWeather
    hourly: list[HourlyWeather] = field(default_factory=list)
    daily: list[DailyWeather] = field(default_factory=list)
    weekly: list[WeeklyWeather] = field(default_factory=list)