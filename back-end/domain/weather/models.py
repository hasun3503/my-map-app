from dataclasses import dataclass
from datetime import datetime


@dataclass
class WeatherResult:
    observed_at: datetime | None
    temperature_c: float | None
    humidity_percent: float | None
    wind_speed_mps: float | None
    feels_like_c: float | None
    hourly: list
    daily: list
