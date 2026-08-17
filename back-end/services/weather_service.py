from datetime import datetime
from zoneinfo import ZoneInfo

from domain.weather.grid import to_kma_grid
from domain.weather.loader import fetch_weather_raw
from domain.weather.models import WeatherResult
from domain.weather.transformer import normalize_weather


KST = ZoneInfo("Asia/Seoul")


async def get_weather(
    latitude: float,
    longitude: float,
    at: datetime | None = None,
) -> WeatherResult:
    """좌표 기준 현재·시간별·일별 날씨 정보를 반환한다."""
    requested_at = at or datetime.now(KST)

    if requested_at.tzinfo is None:
        requested_at = requested_at.replace(tzinfo=KST)

    grid_x, grid_y = to_kma_grid(latitude, longitude)

    raw = await fetch_weather_raw(
        nx=grid_x,
        ny=grid_y,
        at=requested_at,
    )

    return normalize_weather(
        raw=raw,
        latitude=latitude,
        longitude=longitude,
        grid_x=grid_x,
        grid_y=grid_y,
        requested_at=requested_at,
    )