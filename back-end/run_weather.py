import asyncio

from services.weather_service import get_weather


CONDITION_LABELS = {
    "clear": "맑음",
    "partly_cloudy": "구름 조금",
    "cloudy": "흐림",
    "rain": "비",
    "rain_snow": "비 또는 눈",
    "snow": "눈",
    "shower": "소나기",
    "unknown": "정보 없음",
}


def format_condition(condition: str | None) -> str:
    if condition is None:
        return "-"

    if "_to_" in condition:
        start, end = condition.split("_to_", maxsplit=1)
        return (
            f"{CONDITION_LABELS.get(start, start)}"
            f" → "
            f"{CONDITION_LABELS.get(end, end)}"
        )

    return CONDITION_LABELS.get(condition, condition)

def format_value(value, suffix=""):
    if value is None:
        return "-"
    return f"{value}{suffix}"



async def main():
    result = await get_weather(
        latitude=37.5172,
        longitude=127.0473,
    )

    current = result.current

    print("\n" + "=" * 56)
    print("                 지역 날씨 조회 결과")
    print("=" * 56)

    print("\n[ 위치 정보 ]")
    print(f"좌표: {result.latitude}, {result.longitude}")
    print(f"기상청 격자: ({result.grid_x}, {result.grid_y})")

    print("\n[ 현재 날씨 ]")
    print(
        f"기준 시각: {current.observed_at:%Y-%m-%d %H:%M}"
        if current.observed_at
        else "기준 시각: -"
    )
    print(f"날씨: {format_condition(current.condition)}")
    print(f"기온: {format_value(current.temperature_c, '°C')}")
    print(f"체감온도: {format_value(current.feels_like_c, '°C')}")
    print(f"습도: {format_value(current.humidity_percent, '%')}")
    print(f"풍속: {format_value(current.wind_speed_mps, ' m/s')}")
    print(f"풍향: {format_value(current.wind_direction_deg, '°')}")

    print("\n[ 시간별 예보 ]")
    print("-" * 56)
    print(f"{'시각':<18} {'날씨':<12} {'기온':>8} {'습도':>8} {'풍속':>10}")
    print("-" * 56)

    for item in result.hourly[:6]:
        print(
            f"{item.at:%m-%d %H:%M}      "
            f"{format_condition(item.condition):<10} "
            f"{format_value(item.temperature_c, '°C'):>8} "
            f"{format_value(item.humidity_percent, '%'):>8} "
            f"{format_value(item.wind_speed_mps, 'm/s'):>10}"
        )

    print("\n[ 일별 예보 ]")
    print("-" * 56)
    print(f"{'날짜':<16} {'날씨':<14} {'최저':>10} {'최고':>10}")
    print("-" * 56)

    for item in result.daily:
        print(
            f"{item.date:%Y-%m-%d}      "
            f"{format_condition(item.condition or 'unknown'):<12} "
            f"{format_value(item.min_temperature_c, '°C'):>10} "
            f"{format_value(item.max_temperature_c, '°C'):>10}"
        )

    print("\n" + "=" * 56)

    print("\n[ 주간 예보 ]")
    print("-" * 72)
    print(f"{'날짜':<16} {'날씨':<22} {'강수확률':>10} {'최저':>10} {'최고':>10}")
    print("-" * 72)

    for item in result.weekly:
        rain_probability = (
            f"{item.rain_probability_percent}%"
            if item.rain_probability_percent is not None
            else "-"
        )
        min_temperature = (
            f"{item.min_temperature_c:.1f}°C"
            if item.min_temperature_c is not None
            else "-"
        )
        max_temperature = (
            f"{item.max_temperature_c:.1f}°C"
            if item.max_temperature_c is not None
            else "-"
        )

        print(
            f"{item.date:%Y-%m-%d}      "
            f"{format_condition(item.condition):<20} "
            f"{rain_probability:>10} "
            f"{min_temperature:>10} "
            f"{max_temperature:>10}"
        )


asyncio.run(main())