import asyncio
import logging
import time
from urllib.parse import quote

import httpx

from domain.common.exceptions import ExternalDataError
from settings import get_settings


logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 300

_population_cache: dict[str, tuple[float, dict]] = {}
_cache_lock = asyncio.Lock()


def _build_url(
    area_code: str,
) -> str:
    settings = get_settings()

    if not settings.seoul_api_key:
        raise ExternalDataError(
            "SEOUL_API_KEY가 설정되지 않았습니다. "
            ".env와 settings.py의 환경변수 이름을 확인하세요."
        )

    base_url = settings.seoul_api_base_url.rstrip("/")
    encoded_area_code = quote(area_code, safe="")

    return (
        f"{base_url}/"
        f"{settings.seoul_api_key}/"
        f"json/"
        f"citydata_ppltn/"
        f"1/1/"
        f"{encoded_area_code}"
    )

def _extract_row(
    payload: dict,
    area_code: str,
) -> dict:
    """
    서울 citydata_ppltn API 응답에서
    첫 번째 실시간 인구 데이터를 꺼낸다.

    실제 JSON 응답 구조:

    {
        "SeoulRtd.citydata_ppltn": [
            {
                "AREA_NM": "선릉역",
                "AREA_CD": "POI034",
                "AREA_CONGEST_LVL": "보통",
                ...
            }
        ],
        "RESULT": {
            "CODE": "INFO-000",
            "MESSAGE": "정상 처리되었습니다"
        }
    }
    """
    result = payload.get("RESULT", {})

    if isinstance(result, dict):
        result_code = result.get("CODE")

        if result_code and result_code != "INFO-000":
            result_message = result.get(
                "MESSAGE",
                "서울 실시간 인구 API 요청에 실패했습니다.",
            )

            raise ExternalDataError(
                "서울 실시간 인구 API 오류: "
                f"area_code={area_code}, "
                f"code={result_code}, "
                f"message={result_message}"
            )

    service_payload = payload.get(
        "SeoulRtd.citydata_ppltn",
    )

    if not isinstance(service_payload, list):
        raise ExternalDataError(
            "서울 실시간 인구 API 응답에 "
            "SeoulRtd.citydata_ppltn 데이터가 없습니다. "
            f"area_code={area_code}, "
            f"payload_keys={list(payload.keys())}"
        )

    if not service_payload:
        raise ExternalDataError(
            "서울 실시간 인구 API에서 "
            "인구 데이터를 찾지 못했습니다. "
            f"area_code={area_code}"
        )

    first_row = service_payload[0]

    if not isinstance(first_row, dict):
        raise ExternalDataError(
            "서울 실시간 인구 API 응답 데이터 형식이 올바르지 않습니다. "
            f"area_code={area_code}, "
            f"row_type={type(first_row).__name__}"
        )

    return first_row


async def _request_population_raw(
    area_code: str,
) -> dict:
    url = _build_url(area_code)

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
        ) as client:
            response = await client.get(url)

    except httpx.HTTPError as exc:
        raise ExternalDataError(
            "서울 실시간 인구 API 네트워크 요청에 실패했습니다. "
            f"area_code={area_code}, "
            f"error={type(exc).__name__}: {exc}"
        ) from exc

    if response.status_code != 200:
        body_preview = response.text[:500].replace(
            "\n",
            " ",
        )

        raise ExternalDataError(
            "서울 실시간 인구 API HTTP 오류: "
            f"status_code={response.status_code}, "
            f"area_code={area_code}, "
            f"body={body_preview}"
        )

    try:
        payload = response.json()

    except ValueError as exc:
        body_preview = response.text[:500].replace(
            "\n",
            " ",
        )

        raise ExternalDataError(
            "서울 실시간 인구 API가 JSON이 아닌 응답을 반환했습니다. "
            f"area_code={area_code}, "
            f"body={body_preview}"
        ) from exc

    if not isinstance(payload, dict):
        raise ExternalDataError(
            "서울 실시간 인구 API 응답 형식이 올바르지 않습니다. "
            f"area_code={area_code}, "
            f"payload_type={type(payload).__name__}"
        )

    return _extract_row(
        payload=payload,
        area_code=area_code,
    )


async def fetch_realtime_population_raw(
    area_code: str,
) -> dict:
    """
    장소 코드 기준 실시간 인구 데이터를 반환한다.

    동일 area_code는 5분간 메모리 캐시를 사용한다.
    """
    normalized_area_code = area_code.strip().upper()

    if not normalized_area_code:
        raise ValueError(
            "area_code must not be empty"
        )

    now = time.monotonic()

    async with _cache_lock:
        cached = _population_cache.get(
            normalized_area_code,
        )

        if cached is not None:
            cached_at, cached_payload = cached

            if now - cached_at < CACHE_TTL_SECONDS:
                logger.info(
                    "서울 실시간 인구 캐시 사용: %s",
                    normalized_area_code,
                )

                return cached_payload.copy()

    raw = await _request_population_raw(
        area_code=normalized_area_code,
    )

    async with _cache_lock:
        _population_cache[normalized_area_code] = (
            time.monotonic(),
            raw.copy(),
        )

    return raw


async def fetch_many_realtime_population_raw(
    area_codes: list[str],
) -> dict[str, dict]:
    """
    여러 장소의 실시간 인구 데이터를 동시에 조회한다.

    일부 장소의 조회가 실패해도 성공한 장소 결과는 반환한다.
    단, 모든 조회가 실패하면 실패 원인을 포함한 예외를 발생시킨다.
    """
    normalized_codes = list(
        dict.fromkeys(
            code.strip().upper()
            for code in area_codes
            if code and code.strip()
        )
    )

    if not normalized_codes:
        return {}

    tasks = [
        fetch_realtime_population_raw(
            area_code=area_code,
        )
        for area_code in normalized_codes
    ]

    results = await asyncio.gather(
        *tasks,
        return_exceptions=True,
    )

    raw_by_area_code: dict[str, dict] = {}
    failures: list[str] = []

    for area_code, result in zip(
        normalized_codes,
        results,
    ):
        if isinstance(result, Exception):
            failure_message = (
                f"{area_code}: "
                f"{type(result).__name__}: "
                f"{result}"
            )

            logger.warning(
                "서울 실시간 인구 조회 실패 - %s",
                failure_message,
            )

            print(
                "[서울 API 조회 실패] "
                f"{failure_message}"
            )

            failures.append(failure_message)
            continue

        raw_by_area_code[area_code] = result

        logger.info(
            "서울 실시간 인구 조회 성공: %s",
            area_code,
        )

        print(
            "[서울 API 조회 성공] "
            f"{area_code}"
        )

    if not raw_by_area_code:
        failure_details = "\n".join(
            f"- {failure}"
            for failure in failures
        )

        raise ExternalDataError(
            "모든 서울 실시간 인구 API 요청이 실패했습니다.\n"
            f"{failure_details}"
        )

    return raw_by_area_code


def clear_population_cache() -> None:
    """테스트 또는 강제 갱신 시 실시간 인구 캐시를 초기화한다."""
    _population_cache.clear()