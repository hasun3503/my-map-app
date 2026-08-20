from math import atan2, cos, radians, sin, sqrt

from domain.population.models import Landmark


EARTH_RADIUS_M = 6_371_008.8


def distance_m(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    """두 위도·경도 좌표 사이의 직선 거리를 미터 단위로 반환한다."""
    latitude_a_rad = radians(latitude_a)
    longitude_a_rad = radians(longitude_a)
    latitude_b_rad = radians(latitude_b)
    longitude_b_rad = radians(longitude_b)

    latitude_delta = latitude_b_rad - latitude_a_rad
    longitude_delta = longitude_b_rad - longitude_a_rad

    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(latitude_a_rad)
        * cos(latitude_b_rad)
        * sin(longitude_delta / 2) ** 2
    )

    central_angle = 2 * atan2(
        sqrt(haversine),
        sqrt(1 - haversine),
    )

    return EARTH_RADIUS_M * central_angle


def rounded_distance_m(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> int:
    """두 좌표 사이의 반올림된 거리(m)를 반환한다."""
    return round(
        distance_m(
            latitude_a=latitude_a,
            longitude_a=longitude_a,
            latitude_b=latitude_b,
            longitude_b=longitude_b,
        )
    )


def find_nearby_landmarks(
    latitude: float,
    longitude: float,
    landmarks: list[Landmark] | tuple[Landmark, ...],
    radius_m: int,
    limit: int,
) -> list[tuple[Landmark, int]]:
    """
    요청 좌표의 반경 안에 있는 랜드마크를 거리순으로 반환한다.

    반환값:
    [
        (Landmark(...), 185),
        (Landmark(...), 920),
    ]
    """
    if radius_m <= 0:
        raise ValueError("radius_m must be greater than 0")

    if limit <= 0:
        raise ValueError("limit must be greater than 0")

    nearby: list[tuple[Landmark, int]] = []

    for landmark in landmarks:
        distance = rounded_distance_m(
            latitude_a=latitude,
            longitude_a=longitude,
            latitude_b=landmark.latitude,
            longitude_b=landmark.longitude,
        )

        if distance <= radius_m:
            nearby.append((landmark, distance))

    nearby.sort(key=lambda item: item[1])

    return nearby[:limit]