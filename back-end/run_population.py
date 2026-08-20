
from domain.population.landmark_loader import load_landmarks
from domain.population.calculator import find_nearby_landmarks


landmarks = load_landmarks()

nearby_landmarks = find_nearby_landmarks(
    landmarks=landmarks,
    latitude=37.5172,
    longitude=127.0473,
    radius_m=5000,
    limit=5,
)

print(f"전체 랜드마크: {len(landmarks)}개")
print(f"5km 이내 랜드마크: {len(nearby_landmarks)}개")

for landmark, distance_m in nearby_landmarks[:10]:
    print(f"{landmark.area_name}: {distance_m:,}m")

import asyncio

from domain.population.models import CongestionLevel
from services.population_service import get_nearby_population

CONGESTION_LABELS = {
    CongestionLevel.RELAXED: "여유",
    CongestionLevel.NORMAL: "보통",
    CongestionLevel.SLIGHTLY_CROWDED: "약간 붐빔",
    CongestionLevel.CROWDED: "붐빔",
    CongestionLevel.UNAVAILABLE: "정보 없음",
}


def format_number(
    value: int | None,
) -> str:
    if value is None:
        return "-"

    return f"{value:,}명"


def format_time(
    value,
) -> str:
    if value is None:
        return "-"

    return value.strftime("%Y-%m-%d %H:%M")


def format_congestion(
    level: CongestionLevel,
) -> str:
    return CONGESTION_LABELS.get(
        level,
        "정보 없음",
    )


async def main() -> None:
    latitude = 37.5172
    longitude = 127.0473
    radius_m = 5000
    limit = 5

    result = await get_nearby_population(
        latitude=latitude,
        longitude=longitude,
        radius_m=radius_m,
        limit=limit,
    )

    print("\n" + "=" * 76)
    print("                    주변 실시간 인구 조회 결과")
    print("=" * 76)

    print("\n[ 요청 위치 ]")
    print(f"좌표: {result.latitude}, {result.longitude}")
    print(f"검색 반경: {result.radius_m:,}m")
    print(f"요청 시각: {format_time(result.requested_at)}")
    print(f"조회된 장소: {len(result.items)}개")

    if not result.items:
        print("\n[ 주변 인구 데이터 ]")
        print("검색 반경 안에 실시간 인구 데이터를 제공하는 장소가 없습니다.")
        print("\n" + "=" * 76)
        return

    print("\n[ 주변 실시간 인구 데이터 ]")
    print("-" * 76)
    print(
        f"{'장소':<26} "
        f"{'거리':>8} "
        f"{'혼잡도':>14} "
        f"{'인구 범위':>20} "
        f"{'기준 시각':>18}"
    )
    print("-" * 76)

    for item in result.items:
        population_range = (
            f"{format_number(item.population_min)}"
            f" ~ "
            f"{format_number(item.population_max)}"
        )

        print(
            f"{item.area_name:<24} "
            f"{item.distance_m:>7,}m "
            f"{format_congestion(item.congestion_level):>12} "
            f"{population_range:>22} "
            f"{format_time(item.measured_at):>18}"
        )

    print("-" * 76)

    print("\n[ 상세 좌표 ]")

    for item in result.items:
        print(
            f"{item.area_name} ({item.area_code})\n"
            f"  좌표: {item.latitude}, {item.longitude}\n"
            f"  거리: {item.distance_m:,}m\n"
            f"  상태: {item.congestion_message}\n"
        )

    print("=" * 76)


if __name__ == "__main__":
    asyncio.run(main())