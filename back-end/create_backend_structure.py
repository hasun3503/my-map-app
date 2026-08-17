from pathlib import Path

ROOT = Path("./")

FILES = {
    "domain/__init__.py": "",
    "domain/weather/__init__.py": "",
    "domain/weather/models.py": "from dataclasses import dataclass\nfrom datetime import datetime\n\n\n@dataclass\nclass WeatherResult:\n    observed_at: datetime | None\n    temperature_c: float | None\n    humidity_percent: float | None\n    wind_speed_mps: float | None\n    feels_like_c: float | None\n    hourly: list\n    daily: list\n",
    "domain/weather/loader.py": "async def fetch_weather_raw(*args, **kwargs) -> dict:\n    raise NotImplementedError\n",
    "domain/weather/transformer.py": "def normalize_weather(raw: dict):\n    raise NotImplementedError\n",
    "domain/weather/calculator.py": "def calculate_feels_like(temperature_c: float, humidity_percent: float, wind_speed_mps: float) -> float:\n    raise NotImplementedError\n",
    "domain/weather/grid.py": "def to_kma_grid(lat: float, lng: float) -> tuple[int, int]:\n    raise NotImplementedError\n",
    "domain/population/__init__.py": "",
    "domain/population/models.py": "from dataclasses import dataclass\nfrom datetime import datetime\n\n\n@dataclass\nclass StationFlow:\n    station_id: str\n    boarding_count: int\n    alighting_count: int\n    observed_at: datetime\n\n\n@dataclass\nclass RegionSubwayFlow:\n    region_code: str\n    boarding_count: int\n    alighting_count: int\n    net_inflow: int\n    mobility_volume: int\n    observed_from: datetime\n    observed_to: datetime\n",
    "domain/population/subway_loader.py": "async def fetch_station_flows(station_ids: list[str], from_at, to_at):\n    raise NotImplementedError\n",
    "domain/population/mapper.py": "def get_station_ids_by_region(region_code: str) -> list[str]:\n    raise NotImplementedError\n",
    "domain/population/calculator.py": "def calculate_region_subway_flow(region_code: str, station_flows, from_at, to_at):\n    raise NotImplementedError\n",
    "domain/population/level.py": "def to_activity_level(mobility_volume: int) -> str:\n    raise NotImplementedError\n",
    "domain/common/__init__.py": "",
    "domain/common/exceptions.py": "class ExternalDataError(Exception):\n    pass\n\n\nclass DataNotFoundError(Exception):\n    pass\n",
    "services/__init__.py": "",
    "services/weather_service.py": "async def get_weather(region_code: str, at=None):\n    raise NotImplementedError\n",
    "services/population_service.py": "async def get_region_subway_flow(region_code: str, from_at, to_at):\n    raise NotImplementedError\n",
}


def create_structure() -> None:
    for relative_path, content in FILES.items():
        path = ROOT / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)

        if not path.exists():
            path.write_text(content, encoding="utf-8")
            print(f"created: {path}")
        else:
            print(f"skipped: {path} (already exists)")


if __name__ == "__main__":
    create_structure()
