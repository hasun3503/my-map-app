from pathlib import Path

SRC_DIR = Path("./src")

CREATE_DIRECTORIES = (
    "features/weather/components",
    "features/population/components",
    "hooks",
    "services",
    "types",
)

REMOVE_DIRECTORIES = (
    "features/weather/hooks",
    "features/weather/services",
    "features/weather/types",
    "features/population/hooks",
    "features/population/services",
    "features/population/types",
    "features/location/hooks",
    "features/location",
)


def remove_if_empty_or_gitkeep_only(directory: Path) -> bool:
    if not directory.is_dir():
        return False

    contents = list(directory.iterdir())

    if not contents or all(item.name == ".gitkeep" for item in contents):
        for item in contents:
            item.unlink()
        directory.rmdir()
        return True

    print(f"건너뜀(파일 존재): {directory.as_posix()}")
    return False


def main() -> None:
    if not SRC_DIR.is_dir():
        raise FileNotFoundError(
            f"'{SRC_DIR}'를 찾을 수 없습니다. "
            "저장소 루트(my-map-app)에서 실행하세요."
        )

    print("\n[ 생성 또는 유지 ]")

    for relative_path in CREATE_DIRECTORIES:
        directory = SRC_DIR / relative_path
        directory.mkdir(parents=True, exist_ok=True)
        (directory / ".gitkeep").touch(exist_ok=True)
        print(f"- {directory.as_posix()}")

    print("\n[ feature 내부 중복 폴더 정리 ]")

    for relative_path in REMOVE_DIRECTORIES:
        directory = SRC_DIR / relative_path
        if remove_if_empty_or_gitkeep_only(directory):
            print(f"- 제거: {directory.as_posix()}")


if __name__ == "__main__":
    main()