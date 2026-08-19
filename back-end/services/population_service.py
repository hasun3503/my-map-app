from datetime import datetime
from zoneinfo import ZoneInfo

from domain.population.calculator import (
    find_nearby_landmarks,
)
from domain.population.landmark_loader import (
    load_landmarks,
)
from domain.population.models import (
    NearbyPopulationResult,
)
from domain.population.realtime_loader import (
    fetch_many_realtime_population_raw,
)
from domain.population.transformer import (
    normalize_population_point,
)


KST = ZoneInfo("Asia/Seoul")

DEFAULT_RADIUS_M = 3000
DEFAULT_LIMIT = 5
MAX_RADIUS_M = 20000
MAX_LIMIT = 20


def _validate_coordinate(
    latitude: float,
    longitude: float,
) -> None:
    if not -90 <= latitude <= 90:
        raise ValueError(
            "latitude must be between -90 and 90"
        )

    if not -180 <= longitude <= 180:
        raise ValueError(
            "longitude must be between -180 and 180"
        )


def _validate_search_options(
    radius_m: int,
    limit: int,
) -> None:
    if not 1 <= radius_m <= MAX_RADIUS_M:
        raise ValueError(
            f"radius_m must be between 1 and {MAX_RADIUS_M}"
        )

    if not 1 <= limit <= MAX_LIMIT:
        raise ValueError(
            f"limit must be between 1 and {MAX_LIMIT}"
        )


def _find_raw_population(
    raw_by_area_key: dict,
    area_code: str,
    area_name: str,
):
    """
    API 로더가 장소코드 또는 장소명을 dict key로 사용하더라도
    실시간 인구 원본 데이터를 찾는다.
    """
    raw = raw_by_area_key.get(area_code)

    if raw is not None:
        return raw

    return raw_by_area_key.get(area_name)


async def get_nearby_population(
    latitude: float,
    longitude: float,
    radius_m: int = DEFAULT_RADIUS_M,
    limit: int = DEFAULT_LIMIT,
    at: datetime | None = None,
) -> NearbyPopulationResult:
    """
    요청 좌표 주변의 서울 실시간 인구 제공 장소를 반환한다.
    """
    _validate_coordinate(
        latitude=latitude,
        longitude=longitude,
    )

    _validate_search_options(
        radius_m=radius_m,
        limit=limit,
    )

    requested_at = at or datetime.now(KST)

    if requested_at.tzinfo is None:
        requested_at = requested_at.replace(
            tzinfo=KST,
        )

    landmarks = load_landmarks()

    nearby_landmarks = find_nearby_landmarks(
        latitude=latitude,
        longitude=longitude,
        landmarks=landmarks,
        radius_m=radius_m,
        limit=limit,
    )

    if not nearby_landmarks:
        return NearbyPopulationResult(
            latitude=latitude,
            longitude=longitude,
            radius_m=radius_m,
            requested_at=requested_at,
            items=[],
        )

    area_codes = [
        landmark.area_code
        for landmark, _ in nearby_landmarks
    ]

    raw_by_area_key = await fetch_many_realtime_population_raw(
        area_codes=area_codes,
    )

    print("\n[ 서울 API 반환 key ]")
    print(list(raw_by_area_key.keys()))

    population_points = []

    for landmark, distance_m in nearby_landmarks:
        raw = _find_raw_population(
            raw_by_area_key=raw_by_area_key,
            area_code=landmark.area_code,
            area_name=landmark.area_name,
        )

        if raw is None:
            print(
                "[실시간 인구 없음] "
                f"{landmark.area_name} "
                f"(code={landmark.area_code})"
            )
            continue

        print(
            "[실시간 인구 연결 성공] "
            f"{landmark.area_name} "
            f"(code={landmark.area_code})"
        )

        population_points.append(
            normalize_population_point(
                landmark=landmark,
                distance_m=distance_m,
                raw=raw,
            )
        )

    return NearbyPopulationResult(
        latitude=latitude,
        longitude=longitude,
        radius_m=radius_m,
        requested_at=requested_at,
        items=population_points,
    )