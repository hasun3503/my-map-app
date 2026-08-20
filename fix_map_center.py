from pathlib import Path
import re


TARGET = Path("front-end/src/app/map.tsx")


def replace_once(
    source: str,
    pattern: str,
    replacement: str,
    label: str,
) -> str:
    updated, count = re.subn(
        pattern,
        replacement,
        source,
        count=1,
        flags=re.DOTALL,
    )

    if count != 1:
        raise RuntimeError(
            f"{label} 수정 실패: 대상 코드를 정확히 1개 찾지 못했습니다. "
            f"count={count}"
        )

    return updated


def main() -> None:
    if not TARGET.is_file():
        raise FileNotFoundError(
            f"파일을 찾을 수 없습니다: {TARGET}"
        )

    source = TARGET.read_text(encoding="utf-8")

    source = replace_once(
        source,
        r"""\},\s*\[\s*
\s*handleMapIdle,\s*
\s*renderDensityPolygons,\s*
\s*\]\);""",
        """}, [
  renderDensityPolygons,
  renderSearchMarkers,
]);""",
        "handleMapIdle 의존성 배열",
    )

    source = replace_once(
        source,
        r"""\},\s*\[\s*
\s*renderDensityPolygons,\s*
\s*renderSearchMarkers,\s*
\s*\]\);\s*
\s*
\s*// ==================== 장소 검색 ===================="""",
        """}, [
  handleMapIdle,
  renderDensityPolygons,
]);

  // ==================== 장소 검색 ====================""",
        "지도 초기화 useEffect 의존성 배열",
    )

    nested_cleanup = r"""
\s*
\s*useEffect\(\(\)\s*=>\s*\{
\s*return\s*\(\)\s*=>\s*\{
\s*if\s*\(\s*centerUpdateTimerRef\.current\s*\)\s*\{
\s*clearTimeout\(\s*centerUpdateTimerRef\.current\s*\);
\s*\}
\s*\};
\s*\},\s*\[\s*\]\s*\);
"""

    source, cleanup_count = re.subn(
        nested_cleanup,
        "",
        source,
        flags=re.DOTALL,
    )

    if cleanup_count < 1:
        print(
            "[안내] 중첩된 cleanup useEffect를 찾지 못했습니다. "
            "이미 제거된 상태일 수 있습니다."
        )

    target_dependency_pattern = r"""
\},\s*\[
\s*activeFilter,\s*
\s*mapCenter,\s*
\s*mapReady,\s*
\s*renderSearchMarkers,\s*
\]\);
"""

    if not re.search(
        target_dependency_pattern,
        source,
        flags=re.DOTALL,
    ):
        raise RuntimeError(
            "시설 검색 useEffect 의존성 배열에 mapCenter가 없습니다."
        )

    TARGET.write_text(
        source,
        encoding="utf-8",
    )

    print("map.tsx 수정 완료")
    print("- handleMapIdle 자기 참조 제거")
    print("- 지도 초기화 Effect 의존성 수정")
    print("- Effect 내부 중첩 useEffect 제거")
    print("- mapCenter 기반 시설 재검색 유지")


if __name__ == "__main__":
    main()