from fastapi import APIRouter

from routers.population_router import (
    router as population_router,
)
from routers.weather_router import (
    router as weather_router,
)


api_router = APIRouter()

api_router.include_router(
    population_router,
)

api_router.include_router(
    weather_router,
)