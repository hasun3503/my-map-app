from datetime import datetime
from zoneinfo import ZoneInfo

from domain.weather.grid import to_kma_grid
from domain.weather.loader import fetch_weather_raw
from domain.weather.midterm_loader import fetch_midterm_weather_raw
from domain.weather.midterm_transformer import normalize_midterm_weekly
from domain.weather.models import WeatherResult
from domain.weather.transformer import normalize_weather


KST = ZoneInfo("Asia/Seoul")


async def get_weather(
    latitude: float,
    longitude: float,
    at: datetime | None = None,
) -> WeatherResult:
    """좌표 기준 현재·시간별·일별·주간 날씨 정보를 반환한다."""
    requested_at = at or datetime.now(KST)

    if requested_at.tzinfo is None:
        requested_at = requested_at.replace(tzinfo=KST)

    grid_x, grid_y = to_kma_grid(latitude, longitude)

    short_term_raw = await fetch_weather_raw(
        nx=grid_x,
        ny=grid_y,
        at=requested_at,
    )

    result = normalize_weather(
        raw=short_term_raw,
        latitude=latitude,
        longitude=longitude,
        grid_x=grid_x,
        grid_y=grid_y,
        requested_at=requested_at,
    )

    midterm_raw = await fetch_midterm_weather_raw(
        latitude=latitude,
        longitude=longitude,
        at=requested_at,
    )

    short_term_dates = {
        item.date
        for item in result.daily
    }

    result.weekly = [
        item
        for item in normalize_midterm_weekly(midterm_raw)
        if item.date not in short_term_dates
    ]

    return result