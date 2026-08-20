def calculate_feels_like(
    temperature_c: float | None,
    humidity_percent: float | None,
    wind_speed_mps: float | None,
) -> float | None:
    """고온에서는 Heat Index, 저온에서는 Wind Chill로 체감온도를 계산한다."""
    if temperature_c is None:
        return None

    humidity = humidity_percent if humidity_percent is not None else 50.0
    wind_kmh = max((wind_speed_mps or 0.0) * 3.6, 0.0)

    if temperature_c >= 27.0 and humidity_percent is not None:
        temperature_f = temperature_c * 9 / 5 + 32

        heat_index_f = (
            -42.379
            + 2.04901523 * temperature_f
            + 10.14333127 * humidity
            - 0.22475541 * temperature_f * humidity
            - 0.00683783 * temperature_f**2
            - 0.05481717 * humidity**2
            + 0.00122874 * temperature_f**2 * humidity
            + 0.00085282 * temperature_f * humidity**2
            - 0.00000199 * temperature_f**2 * humidity**2
        )

        return round((heat_index_f - 32) * 5 / 9, 1)

    if temperature_c <= 10.0 and wind_kmh > 4.8:
        wind_chill = (
            13.12
            + 0.6215 * temperature_c
            - 11.37 * wind_kmh**0.16
            + 0.3965 * temperature_c * wind_kmh**0.16
        )
        return round(wind_chill, 1)

    return round(temperature_c, 1)