from dataclasses import dataclass
from datetime import datetime


@dataclass
class StationFlow:
    station_id: str
    boarding_count: int
    alighting_count: int
    observed_at: datetime


@dataclass
class RegionSubwayFlow:
    region_code: str
    boarding_count: int
    alighting_count: int
    net_inflow: int
    mobility_volume: int
    observed_from: datetime
    observed_to: datetime
