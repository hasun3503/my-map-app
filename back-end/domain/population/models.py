from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum


class PopulationSource(StrEnum):
    SEOUL_REALTIME_LANDMARK = "seoul_realtime_landmark"


class CongestionLevel(StrEnum):
    RELAXED = "relaxed"
    NORMAL = "normal"
    SLIGHTLY_CROWDED = "slightly_crowded"
    CROWDED = "crowded"
    UNAVAILABLE = "unavailable"


@dataclass(frozen=True)
class Landmark:
    """서울시 실시간 인구 데이터 제공 장소의 기준 좌표 정보."""

    area_code: str
    area_name: str
    latitude: float
    longitude: float


@dataclass
class PopulationPoint:
    """랜드마크 한 곳의 실시간 인구·혼잡도 정보."""

    area_code: str
    area_name: str
    latitude: float
    longitude: float
    distance_m: int

    population_min: int | None
    population_max: int | None

    congestion_level: CongestionLevel
    congestion_message: str | None
    measured_at: datetime | None

    source: PopulationSource = (
        PopulationSource.SEOUL_REALTIME_LANDMARK
    )


@dataclass
class NearbyPopulationResult:
    """요청 좌표 주변의 실시간 인구 제공 장소 목록."""

    latitude: float
    longitude: float
    radius_m: int
    requested_at: datetime

    items: list[PopulationPoint] = field(
        default_factory=list
    )