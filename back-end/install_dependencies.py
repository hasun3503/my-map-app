import subprocess
import sys
from pathlib import Path

REQUIREMENTS = Path(__file__).with_name("requirements.txt")


def install() -> None:
    if not REQUIREMENTS.exists():
        raise FileNotFoundError(f"requirements file not found: {REQUIREMENTS}")

    subprocess.check_call([
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "pip",
    ])
    subprocess.check_call([
        sys.executable,
        "-m",
        "pip",
        "install",
        "-r",
        str(REQUIREMENTS),
    ])


if __name__ == "__main__":
    install()
