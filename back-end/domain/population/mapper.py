from domain.population.landmark_loader import load_landmarks
from domain.population.models import Landmark


def _is_inside_polygon(
    longitude: float,
    latitude: float,
    polygon: tuple[tuple[float, float], ...],
) -> bool:
    """Ray casting 방식으로 좌표가 다각형 내부에 포함되는지 확인한다."""
    is_inside = False
    previous_longitude, previous_latitude = polygon[-1]

    for current_longitude, current_latitude in polygon:
        intersects = (
            (current_latitude > latitude)
            != (previous_latitude > latitude)
        ) and (
            longitude
            < (
                (previous_longitude - current_longitude)
                * (latitude - current_latitude)
                / (previous_latitude - current_latitude)
                + current_longitude
            )
        )

        if intersects:
            is_inside = not is_inside

        previous_longitude = current_longitude
        previous_latitude = current_latitude

    return is_inside


def find_landmark_by_coordinate(
    latitude: float,
    longitude: float,
) -> Landmark | None:
    """
    좌표를 포함하는 서울시 실시간 인구 데이터 주요 장소를 반환한다.

    주요 장소 영역 밖이면 None을 반환한다.
    """
    for landmark in load_landmarks():
        if _is_inside_polygon(
            longitude=longitude,
            latitude=latitude,
            polygon=landmark.polygon,
        ):
            return landmark

    return None