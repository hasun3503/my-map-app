import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

from domain.common.exceptions import ExternalDataError
from settings import get_settings


KST = ZoneInfo("Asia/Seoul")
SERVICE_PATH = "/api/typ02/openApi/MidFcstInfoService"

MIDTERM_REGIONS = (
    {
        "name": "서울·인천·경기도",
        "land_reg_id": "11B00000",
        "temperature_reg_id": "11B10101",
        "min_latitude": 36.8,
        "max_latitude": 38.6,
        "min_longitude": 125.8,
        "max_longitude": 127.9,
    },
    {
        "name": "강원영서",
        "land_reg_id": "11D10000",
        "temperature_reg_id": "11D10301",
        "min_latitude": 37.0,
        "max_latitude": 38.7,
        "min_longitude": 127.9,
        "max_longitude": 128.6,
    },
    {
        "name": "강원영동",
        "land_reg_id": "11D20000",
        "temperature_reg_id": "11D20501",
        "min_latitude": 37.0,
        "max_latitude": 38.7,
        "min_longitude": 128.6,
        "max_longitude": 129.7,
    },
    {
        "name": "충청북도",
        "land_reg_id": "11C10000",
        "temperature_reg_id": "11C10301",
        "min_latitude": 36.1,
        "max_latitude": 37.4,
        "min_longitude": 127.3,
        "max_longitude": 128.6,
    },
    {
        "name": "대전·세종·충청남도",
        "land_reg_id": "11C20000",
        "temperature_reg_id": "11C20401",
        "min_latitude": 35.7,
        "max_latitude": 37.1,
        "min_longitude": 126.0,
        "max_longitude": 127.6,
    },
    {
        "name": "전북특별자치도",
        "land_reg_id": "11F10000",
        "temperature_reg_id": "11F10201",
        "min_latitude": 35.2,
        "max_latitude": 36.3,
        "min_longitude": 126.3,
        "max_longitude": 127.7,
    },
    {
        "name": "광주·전라남도",
        "land_reg_id": "11F20000",
        "temperature_reg_id": "11F20501",
        "min_latitude": 33.0,
        "max_latitude": 35.5,
        "min_longitude": 125.0,
        "max_longitude": 127.7,
    },
    {
        "name": "대구·경상북도",
        "land_reg_id": "11H10000",
        "temperature_reg_id": "11H10701",
        "min_latitude": 35.4,
        "max_latitude": 37.4,
        "min_longitude": 127.6,
        "max_longitude": 130.9,
    },
    {
        "name": "부산·울산·경상남도",
        "land_reg_id": "11H20000",
        "temperature_reg_id": "11H20201",
        "min_latitude": 34.5,
        "max_latitude": 36.1,
        "min_longitude": 127.5,
        "max_longitude": 129.7,
    },
    {
        "name": "제주도",
        "land_reg_id": "11G00000",
        "temperature_reg_id": "11G00201",
        "min_latitude": 33.0,
        "max_latitude": 34.2,
        "min_longitude": 126.0,
        "max_longitude": 127.1,
    },
)


def _latest_midterm_base_time(at: datetime) -> str:
    """중기예보의 사용 가능한 최신 발표 시각(06:00 또는 18:00)을 반환한다."""
    local_at = at.astimezone(KST)
    publication_delay = timedelta(minutes=40)

    morning = local_at.replace(hour=6, minute=0, second=0, microsecond=0)
    evening = local_at.replace(hour=18, minute=0, second=0, microsecond=0)

    if local_at >= evening + publication_delay:
        base = evening
    elif local_at >= morning + publication_delay:
        base = morning
    else:
        base = (local_at - timedelta(days=1)).replace(
            hour=18,
            minute=0,
            second=0,
            microsecond=0,
        )

    return base.strftime("%Y%m%d%H00")


def _find_midterm_region(
    latitude: float,
    longitude: float,
) -> dict[str, str]:
    """좌표에 맞는 중기예보 광역권 코드 정보를 반환한다."""
    for region in MIDTERM_REGIONS:
        if (
            region["min_latitude"] <= latitude <= region["max_latitude"]
            and region["min_longitude"] <= longitude <= region["max_longitude"]
        ):
            return {
                "name": region["name"],
                "land_reg_id": region["land_reg_id"],
                "temperature_reg_id": region["temperature_reg_id"],
            }

    raise ExternalDataError(
        f"중기예보 지원 지역을 찾을 수 없습니다: "
        f"latitude={latitude}, longitude={longitude}"
    )


async def _request(
    endpoint: str,
    reg_id: str,
    tm_fc: str,
) -> list[dict]:
    """기상청 중기예보 API를 요청하고 item 목록을 반환한다."""
    settings = get_settings()

    params = {
        "authKey": settings.kma_apihub_auth_key,
        "pageNo": "1",
        "numOfRows": "10",
        "dataType": "JSON",
        "regId": reg_id,
        "tmFc": tm_fc,
    }

    base_url = settings.kma_apihub_base_url.rstrip("/")
    url = f"{base_url}{SERVICE_PATH}/{endpoint}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
    except httpx.HTTPError as exc:
        raise ExternalDataError(
            f"KMA mid-term API network request failed: {endpoint}"
        ) from exc

    if response.status_code != 200:
        body_preview = response.text[:300].replace("\n", " ")
        raise ExternalDataError(
            f"KMA mid-term API HTTP {response.status_code} "
            f"for {endpoint}. "
            f"content_type={response.headers.get('content-type')}. "
            f"body={body_preview}"
        )

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        body_preview = response.text[:300].replace("\n", " ")
        raise ExternalDataError(
            f"KMA mid-term API returned non-JSON for {endpoint}. "
            f"content_type={response.headers.get('content-type')}. "
            f"body={body_preview}"
        ) from exc

    header = payload.get("response", {}).get("header", {})
    result_code = header.get("resultCode")

    if result_code != "00":
        message = header.get("resultMsg", "KMA mid-term API returned an error")
        raise ExternalDataError(
            f"KMA mid-term API error for {endpoint}: "
            f"result_code={result_code}, message={message}"
        )

    items = (
        payload.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )

    if isinstance(items, dict):
        return [items]

    return items


async def fetch_midterm_weather_raw(
    latitude: float,
    longitude: float,
    at: datetime,
) -> dict[str, object]:
    """좌표 기준 중기 육상예보와 기온예보 원본을 조회한다."""
    region = _find_midterm_region(latitude, longitude)
    tm_fc = _latest_midterm_base_time(at)

    land, temperature = await _fetch_land_and_temperature(
        land_reg_id=region["land_reg_id"],
        temperature_reg_id=region["temperature_reg_id"],
        tm_fc=tm_fc,
    )

    return {
        "region_name": region["name"],
        "tm_fc": tm_fc,
        "land": land,
        "temperature": temperature,
    }


async def _fetch_land_and_temperature(
    land_reg_id: str,
    temperature_reg_id: str,
    tm_fc: str,
) -> tuple[list[dict], list[dict]]:
    import asyncio

    return await asyncio.gather(
        _request(
            endpoint="getMidLandFcst",
            reg_id=land_reg_id,
            tm_fc=tm_fc,
        ),
        _request(
            endpoint="getMidTa",
            reg_id=temperature_reg_id,
            tm_fc=tm_fc,
        ),
    )