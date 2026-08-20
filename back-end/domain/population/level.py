from domain.population.models import CongestionLevel


_CONGESTION_LEVELS = {
    "여유": CongestionLevel.RELAXED,
    "보통": CongestionLevel.NORMAL,
    "약간 붐빔": CongestionLevel.SLIGHTLY_CROWDED,
    "붐빔": CongestionLevel.CROWDED,
}


_CONGESTION_MESSAGES = {
    CongestionLevel.RELAXED: "여유",
    CongestionLevel.NORMAL: "보통",
    CongestionLevel.SLIGHTLY_CROWDED: "약간 붐빔",
    CongestionLevel.CROWDED: "붐빔",
    CongestionLevel.UNAVAILABLE: "인구 혼잡도 정보 없음",
}


def normalize_congestion_level(
    raw_level: str | None,
) -> CongestionLevel:
    """서울시 원본 혼잡도 문구를 내부 상태값으로 변환한다."""
    if raw_level is None:
        return CongestionLevel.UNAVAILABLE

    normalized = raw_level.strip()

    if not normalized:
        return CongestionLevel.UNAVAILABLE

    return _CONGESTION_LEVELS.get(
        normalized,
        CongestionLevel.UNAVAILABLE,
    )


def congestion_message(
    level: CongestionLevel,
) -> str:
    """프론트 표시용 한글 혼잡도 문구를 반환한다."""
    return _CONGESTION_MESSAGES[level]