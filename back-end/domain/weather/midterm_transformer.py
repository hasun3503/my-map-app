from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from domain.weather.models import WeeklyWeather


KST = ZoneInfo("Asia/Seoul")


def _number(value: object) -> float | None:
    if value in (None, "", "-", "null"):
        return None

    try:
        return float(str(value))
    except ValueError:
        return None


def _integer(value: object) -> int | None:
    number = _number(value)

    if number is None:
        return None

    return int(number)


def _normalize_condition(value: object) -> str | None:
    if value in (None, ""):
        return None

    text = str(value).strip()

    if "비/눈" in text:
        return "rain_snow"
    if "눈" in text:
        return "snow"
    if "소나기" in text:
        return "shower"
    if "비" in text:
        return "rain"
    if "구름많" in text:
        return "partly_cloudy"
    if "흐" in text:
        return "cloudy"
    if "맑" in text:
        return "clear"

    return "unknown"


def _merged_condition(
    morning: object,
    afternoon: object,
) -> str | None:
    morning_condition = _normalize_condition(morning)
    afternoon_condition = _normalize_condition(afternoon)

    if morning_condition == afternoon_condition:
        return morning_condition

    rain_conditions = {"rain", "rain_snow", "snow", "shower"}

    if morning_condition in rain_conditions:
        return morning_condition

    if afternoon_condition in rain_conditions:
        return afternoon_condition

    if morning_condition is None:
        return afternoon_condition

    if afternoon_condition is None:
        return morning_condition

    return f"{morning_condition}_to_{afternoon_condition}"


def _max_probability(
    morning: object,
    afternoon: object,
) -> int | None:
    values = [
        value
        for value in (
            _integer(morning),
            _integer(afternoon),
        )
        if value is not None
    ]

    return max(values) if values else None


def normalize_midterm_weekly(
    raw: dict[str, object],
) -> list[WeeklyWeather]:
    """중기 육상·기온예보 응답을 주간 일별 예보 목록으로 변환한다."""
    tm_fc_text = str(raw["tm_fc"])
    issued_at = datetime.strptime(
        tm_fc_text,
        "%Y%m%d%H00",
    ).replace(tzinfo=KST)

    land_items = raw.get("land", [])
    temperature_items = raw.get("temperature", [])

    land = land_items[0] if isinstance(land_items, list) and land_items else {}
    temperature = (
        temperature_items[0]
        if isinstance(temperature_items, list) and temperature_items
        else {}
    )

    weekly: list[WeeklyWeather] = []

    for day_offset in range(3, 11):
        target_date = (issued_at + timedelta(days=day_offset)).date()

        if day_offset <= 7:
            condition = _merged_condition(
                land.get(f"wf{day_offset}Am"),
                land.get(f"wf{day_offset}Pm"),
            )
            rain_probability = _max_probability(
                land.get(f"rnSt{day_offset}Am"),
                land.get(f"rnSt{day_offset}Pm"),
            )
        else:
            condition = _normalize_condition(land.get(f"wf{day_offset}"))
            rain_probability = _integer(land.get(f"rnSt{day_offset}"))

        weekly.append(
            WeeklyWeather(
                date=target_date,
                condition=condition,
                min_temperature_c=_number(
                    temperature.get(f"taMin{day_offset}")
                ),
                max_temperature_c=_number(
                    temperature.get(f"taMax{day_offset}")
                ),
                rain_probability_percent=rain_probability,
            )
        )

    return weekly