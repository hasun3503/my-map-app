from fastapi import (
    APIRouter,
    HTTPException,
    Query,
)

from domain.common.exceptions import ExternalDataError
from services.population_service import (
    DEFAULT_LIMIT,
    DEFAULT_RADIUS_M,
    MAX_LIMIT,
    MAX_RADIUS_M,
    get_nearby_population,
)


router = APIRouter(
    prefix="/population",
    tags=["Population"],
)


@router.get("/nearby")
async def get_nearby_population_endpoint(
    latitude: float = Query(
        ...,
        ge=-90,
        le=90,
        description="조회할 위치의 위도",
        examples=[37.5172],
    ),
    longitude: float = Query(
        ...,
        ge=-180,
        le=180,
        description="조회할 위치의 경도",
        examples=[127.0473],
    ),
    radius_m: int = Query(
        DEFAULT_RADIUS_M,
        ge=1,
        le=MAX_RADIUS_M,
        description="검색 반경(미터)",
        examples=[5000],
    ),
    limit: int = Query(
        DEFAULT_LIMIT,
        ge=1,
        le=MAX_LIMIT,
        description="반환할 최대 장소 수",
        examples=[5],
    ),
):
    """
    현재 위치 주변의 서울 실시간 인구 데이터를 반환한다.
    """
    try:
        return await get_nearby_population(
            latitude=latitude,
            longitude=longitude,
            radius_m=radius_m,
            limit=limit,
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