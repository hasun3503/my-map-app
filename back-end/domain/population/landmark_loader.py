import json
from functools import lru_cache
from pathlib import Path

from domain.common.exceptions import ExternalDataError
from domain.population.models import Landmark


LANDMARKS_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "seoul_realtime_landmarks.json"
)


def _required_string(
    item: dict,
    key: str,
) -> str:
    value = item.get(key)

    if value in (None, ""):
        raise ValueError(f"missing required field: {key}")

    return str(value).strip()


def _required_float(
    item: dict,
    key: str,
) -> float:
    value = item.get(key)

    if value in (None, ""):
        raise ValueError(f"missing required field: {key}")

    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"invalid numeric field: {key}={value}"
        ) from exc


def _to_landmark(item: dict) -> Landmark:
    latitude = _required_float(item, "latitude")
    longitude = _required_float(item, "longitude")

    if not -90 <= latitude <= 90:
        raise ValueError(
            f"latitude out of range: {latitude}"
        )

    if not -180 <= longitude <= 180:
        raise ValueError(
            f"longitude out of range: {longitude}"
        )

    return Landmark(
        area_code=_required_string(item, "area_code"),
        area_name=_required_string(item, "area_name"),
        latitude=latitude,
        longitude=longitude,
    )


@lru_cache
def load_landmarks() -> tuple[Landmark, ...]:
    """
    서울시 실시간 인구 제공 장소 전체를 한 번만 로드한다.

    JSON 변경 사항을 반영하려면 서버를 재시작하거나
    load_landmarks.cache_clear()를 호출한다.
    """
    if not LANDMARKS_PATH.exists():
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크 파일을 찾을 수 없습니다: "
            f"{LANDMARKS_PATH}"
        )

    try:
        payload = json.loads(
            LANDMARKS_PATH.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as exc:
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크 JSON 형식이 올바르지 않습니다."
        ) from exc

    if not isinstance(payload, list):
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크 JSON 최상위 값은 "
            "배열이어야 합니다."
        )

    try:
        landmarks = tuple(
            _to_landmark(item)
            for item in payload
        )
    except (TypeError, ValueError) as exc:
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크 데이터가 올바르지 않습니다: "
            f"{exc}"
        ) from exc

    if not landmarks:
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크 목록이 비어 있습니다."
        )

    area_codes = [landmark.area_code for landmark in landmarks]

    if len(area_codes) != len(set(area_codes)):
        raise ExternalDataError(
            "서울 실시간 인구 랜드마크에 중복된 "
            "area_code가 있습니다."
        )

    return landmarks