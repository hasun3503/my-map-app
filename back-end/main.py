from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.api_router import api_router


app = FastAPI(
    title="My Map API",
    description="지도 기반 주변 정보 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get(
    "/health",
    tags=["Health"],
)
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
    }