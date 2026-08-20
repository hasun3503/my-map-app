from datetime import datetime
from zoneinfo import ZoneInfo

from domain.population.level import (
    congestion_message,
    normalize_congestion_level,
)
from domain.population.models import (
    Landmark,
    PopulationPoint,
)


KST = ZoneInfo("Asia/Seoul")


def _integer(
    value: object,
) -> int | None:
    """서울 API의 숫자 문자열을 정수로 변환한다."""
    if value in (None, "", "-", "null"):
        return None

    try:
        return int(
            float(
                str(value)
                .replace(",", "")
                .strip()
            )
        )
    except (TypeError, ValueError):
        return None


def _parse_measured_at(
    value: object,
) -> datetime | None:
    """서울 API의 인구 측정 시각을 KST datetime으로 변환한다."""
    if value in (None, "", "-", "null"):
        return None

    text = str(value).strip()

    formats = (
        "%Y%m%d%H%M",
        "%Y%m%d%H%M%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    )

    for time_format in formats:
        try:
            return datetime.strptime(
                text,
                time_format,
            ).replace(tzinfo=KST)
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(
            text.replace("Z", "+00:00")
        )
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=KST)

    return parsed.astimezone(KST)


def normalize_population_point(
    landmark: Landmark,
    distance_m: int,
    raw: dict,
) -> PopulationPoint:
    """
    서울 실시간 인구 API 원본 row를 PopulationPoint로 변환한다.

    landmark는 로컬 landmarks.json의 기준 좌표를 사용한다.
    """
    raw_congestion_level = raw.get("AREA_CONGEST_LVL")
    level = normalize_congestion_level(
        str(raw_congestion_level)
        if raw_congestion_level is not None
        else None
    )

    return PopulationPoint(
        area_code=landmark.area_code,
        area_name=landmark.area_name,
        latitude=landmark.latitude,
        longitude=landmark.longitude,
        distance_m=distance_m,
        population_min=_integer(
            raw.get("AREA_PPLTN_MIN")
        ),
        population_max=_integer(
            raw.get("AREA_PPLTN_MAX")
        ),
        congestion_level=level,
        congestion_message=congestion_message(level),
        measured_at=_parse_measured_at(
            raw.get("PPLTN_TIME")
        ),
    )