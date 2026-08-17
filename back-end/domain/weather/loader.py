import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

from domain.common.exceptions import ExternalDataError
from settings import get_settings


KST = ZoneInfo("Asia/Seoul")
SERVICE_PATH = "/api/typ02/openApi/VilageFcstInfoService_2.0"


def _latest_hourly_base_time(
    at: datetime,
    published_minutes: int,
) -> tuple[str, str]:
    """초단기실황/초단기예보의 사용 가능한 발표 시각을 계산한다."""
    local_at = at.astimezone(KST)
    base = local_at.replace(minute=0, second=0, microsecond=0)

    if local_at.minute < published_minutes:
        base -= timedelta(hours=1)

    return base.strftime("%Y%m%d"), base.strftime("%H%M")


def _latest_village_base_time(at: datetime) -> tuple[str, str]:
    """단기예보의 최신 발표 시각을 계산한다."""
    local_at = at.astimezone(KST)
    issue_hours = (2, 5, 8, 11, 14, 17, 20, 23)

    available_hours = [
        hour
        for hour in issue_hours
        if local_at.hour > hour
        or (local_at.hour == hour and local_at.minute >= 10)
    ]

    if available_hours:
        base = local_at.replace(
            hour=available_hours[-1],
            minute=0,
            second=0,
            microsecond=0,
        )
    else:
        previous_day = local_at - timedelta(days=1)
        base = previous_day.replace(
            hour=23,
            minute=0,
            second=0,
            microsecond=0,
        )

    return base.strftime("%Y%m%d"), base.strftime("%H%M")


async def _request(
    endpoint: str,
    base_date: str,
    base_time: str,
    nx: int,
    ny: int,
) -> list[dict]:
    """기상청 APIHub에 요청하고 item 목록만 반환한다."""
    settings = get_settings()

    params = {
        "authKey": settings.kma_apihub_auth_key,
        "pageNo": "1",
        "numOfRows": "1000",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": str(nx),
        "ny": str(ny),
    }

    base_url = settings.kma_apihub_base_url.rstrip("/")
    url = f"{base_url}{SERVICE_PATH}/{endpoint}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)

    except httpx.HTTPError as exc:
        raise ExternalDataError(
            f"KMA APIHub network request failed: {endpoint}"
        ) from exc

    if response.status_code != 200:
        body_preview = response.text[:300].replace("\n", " ")

        raise ExternalDataError(
            f"KMA APIHub HTTP {response.status_code} "
            f"for {endpoint}. "
            f"content_type={response.headers.get('content-type')}. "
            f"body={body_preview}"
        )

    try:
        payload = response.json()

    except json.JSONDecodeError as exc:
        body_preview = response.text[:300].replace("\n", " ")

        raise ExternalDataError(
            f"KMA APIHub returned non-JSON for {endpoint}. "
            f"content_type={response.headers.get('content-type')}. "
            f"body={body_preview}"
        ) from exc

    header = payload.get("response", {}).get("header", {})
    result_code = header.get("resultCode")

    if result_code != "00":
        message = header.get("resultMsg", "KMA APIHub returned an error")

        raise ExternalDataError(
            f"KMA APIHub error for {endpoint}: "
            f"result_code={result_code}, message={message}"
        )

    return (
        payload.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )


async def fetch_weather_raw(
    nx: int,
    ny: int,
    at: datetime,
) -> dict[str, list[dict]]:
    """현재 관측값, 초단기예보, 단기예보 원본을 조회한다."""
    current_date, current_time = _latest_hourly_base_time(
        at,
        published_minutes=40,
    )

    ultra_date, ultra_time = _latest_hourly_base_time(
        at,
        published_minutes=30,
    )

    village_date, village_time = _latest_village_base_time(at)

    current = await _request(
        endpoint="getUltraSrtNcst",
        base_date=current_date,
        base_time=current_time,
        nx=nx,
        ny=ny,
    )

    ultra = await _request(
        endpoint="getUltraSrtFcst",
        base_date=ultra_date,
        base_time=ultra_time,
        nx=nx,
        ny=ny,
    )

    village = await _request(
        endpoint="getVilageFcst",
        base_date=village_date,
        base_time=village_time,
        nx=nx,
        ny=ny,
    )

    return {
        "current": current,
        "ultra": ultra,
        "village": village,
    }