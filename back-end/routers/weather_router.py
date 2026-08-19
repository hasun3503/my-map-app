from fastapi import (
    APIRouter,
    HTTPException,
    Query,
)

from domain.common.exceptions import ExternalDataError
from services.weather_service import get_weather


router = APIRouter(
    prefix="/weather",
    tags=["Weather"],
)


@router.get(
    "/current",
    summary="현재 위치 날씨 조회",
    description="""
현재 좌표 기준 날씨 정보를 조회합니다.

테스트 좌표 조합:

- 강남역: latitude=`37.4979526`, longitude=`127.0276242`
- 광화문: latitude=`37.5723`, longitude=`126.9769`
- 홍대입구역: latitude=`37.5572`, longitude=`126.9245`
- 잠실역: latitude=`37.5133`, longitude=`127.1001`

유효성 검사 테스트:

- latitude=`91` → 422 오류
- longitude=`181` → 422 오류
""",
)
async def get_weather_endpoint(
    latitude: float = Query(
        ...,
        ge=-90,
        le=90,
        description="조회할 위치의 위도",
        openapi_examples={
            "gangnam_station": {
                "summary": "강남역",
                "value": 37.4979526,
            },
            "gwanghwamun": {
                "summary": "광화문",
                "value": 37.5723,
            },
            "hongdae_station": {
                "summary": "홍대입구역",
                "value": 37.5572,
            },
            "jamsil_station": {
                "summary": "잠실역",
                "value": 37.5133,
            },
        },
    ),
    longitude: float = Query(
        ...,
        ge=-180,
        le=180,
        description="조회할 위치의 경도",
        openapi_examples={
            "gangnam_station": {
                "summary": "강남역",
                "value": 127.0276242,
            },
            "gwanghwamun": {
                "summary": "광화문",
                "value": 126.9769,
            },
            "hongdae_station": {
                "summary": "홍대입구역",
                "value": 126.9245,
            },
            "jamsil_station": {
                "summary": "잠실역",
                "value": 127.1001,
            },
        },
    ),
):
    """
    현재 좌표의 날씨 정보를 반환한다.
    """
    try:
        return await get_weather(
            latitude=latitude,
            longitude=longitude,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except ExternalDataError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc