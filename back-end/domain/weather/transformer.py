from collections import defaultdict
from datetime import date, datetime
from zoneinfo import ZoneInfo

from domain.weather.calculator import calculate_feels_like
from domain.weather.models import (
    CurrentWeather,
    DailyWeather,
    HourlyWeather,
    WeatherResult,
)


KST = ZoneInfo("Asia/Seoul")


def _number(value: str | None) -> float | None:
    if value in (None, "", "-", "null"):
        return None

    try:
        return float(value)
    except ValueError:
        return None


def _condition(values: dict[str, str]) -> str:
    precipitation = values.get("PTY", "0")

    if precipitation == "1":
        return "rain"
    if precipitation == "2":
        return "rain_snow"
    if precipitation == "3":
        return "snow"
    if precipitation == "4":
        return "shower"

    sky = values.get("SKY")

    return {
        "1": "clear",
        "3": "partly_cloudy",
        "4": "cloudy",
    }.get(sky, "unknown")


def _parse_forecast_at(
    date_text: str,
    time_text: str,
) -> datetime:
    return datetime.strptime(
        f"{date_text}{time_text}",
        "%Y%m%d%H%M",
    ).replace(tzinfo=KST)


def _group_forecasts(
    items: list[dict],
) -> dict[datetime, dict[str, str]]:
    grouped: dict[datetime, dict[str, str]] = defaultdict(dict)

    for item in items:
        date_text = item.get("fcstDate")
        time_text = item.get("fcstTime")
        category = item.get("category")

        if not date_text or not time_text or not category:
            continue

        forecast_at = _parse_forecast_at(date_text, time_text)
        grouped[forecast_at][category] = item.get("fcstValue", "")

    return grouped


def _current_condition(
    current_values: dict[str, str],
    grouped: dict[datetime, dict[str, str]],
    current_at: datetime,
) -> str:
    """실황 날씨 상태가 없으면 가장 가까운 시간별 예보 상태로 보완한다."""
    condition = _condition(current_values)

    if condition != "unknown" or not grouped:
        return condition

    nearest_forecast_at = min(
        grouped,
        key=lambda forecast_at: abs(
            (forecast_at - current_at).total_seconds()
        ),
    )

    return _condition(grouped[nearest_forecast_at])


def normalize_weather(
    raw: dict[str, list[dict]],
    latitude: float,
    longitude: float,
    grid_x: int,
    grid_y: int,
    requested_at: datetime,
) -> WeatherResult:
    current_values = {
        item.get("category"): item.get("obsrValue")
        for item in raw.get("current", [])
    }

    current_temperature = _number(current_values.get("T1H"))
    current_humidity = _number(current_values.get("REH"))
    current_wind_speed = _number(current_values.get("WSD"))

    current_at = requested_at.astimezone(KST).replace(
        minute=0,
        second=0,
        microsecond=0,
    )

    forecast_items = [
        *raw.get("ultra", []),
        *raw.get("village", []),
    ]
    grouped = _group_forecasts(forecast_items)

    current = CurrentWeather(
        observed_at=current_at,
        temperature_c=current_temperature,
        humidity_percent=current_humidity,
        wind_speed_mps=current_wind_speed,
        wind_direction_deg=_number(current_values.get("VEC")),
        feels_like_c=calculate_feels_like(
            current_temperature,
            current_humidity,
            current_wind_speed,
        ),
        condition=_current_condition(
            current_values=current_values,
            grouped=grouped,
            current_at=current_at,
        ),
    )

    hourly: list[HourlyWeather] = []
    daily_values: dict[date, list[tuple[float, str]]] = defaultdict(list)

    for forecast_at in sorted(grouped):
        values = grouped[forecast_at]

        temperature = _number(
            values.get("TMP") or values.get("T1H")
        )
        humidity = _number(values.get("REH"))
        wind_speed = _number(values.get("WSD"))
        condition = _condition(values)

        hourly.append(
            HourlyWeather(
                at=forecast_at,
                temperature_c=temperature,
                humidity_percent=humidity,
                wind_speed_mps=wind_speed,
                condition=condition,
            )
        )

        if temperature is not None:
            daily_values[forecast_at.date()].append(
                (temperature, condition)
            )

    daily: list[DailyWeather] = []

    for target_date, values in sorted(daily_values.items()):
        temperatures = [temperature for temperature, _ in values]

        daily.append(
            DailyWeather(
                date=target_date,
                min_temperature_c=min(temperatures),
                max_temperature_c=max(temperatures),
                condition=values[0][1] if values else None,
            )
        )

    return WeatherResult(
        latitude=latitude,
        longitude=longitude,
        grid_x=grid_x,
        grid_y=grid_y,
        current=current,
        hourly=hourly,
        daily=daily,
    )