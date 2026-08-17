from math import cos, floor, log, pi, pow, sin, tan


RE = 6371.00877
GRID = 5.0
SLAT1 = 30.0
SLAT2 = 60.0
OLON = 126.0
OLAT = 38.0
XO = 43.0
YO = 136.0


def to_kma_grid(latitude: float, longitude: float) -> tuple[int, int]:
    """WGS84 위도·경도를 기상청 동네예보 격자로 변환한다."""
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("latitude/longitude is outside the valid range")

    deg_to_rad = pi / 180.0

    re = RE / GRID
    slat1 = SLAT1 * deg_to_rad
    slat2 = SLAT2 * deg_to_rad
    olon = OLON * deg_to_rad
    olat = OLAT * deg_to_rad

    sn = log(cos(slat1) / cos(slat2)) / log(
        tan(pi * 0.25 + slat2 * 0.5)
        / tan(pi * 0.25 + slat1 * 0.5)
    )
    sf = pow(tan(pi * 0.25 + slat1 * 0.5), sn) * cos(slat1) / sn
    ro = re * sf / pow(tan(pi * 0.25 + olat * 0.5), sn)

    ra = re * sf / pow(
        tan(pi * 0.25 + latitude * deg_to_rad * 0.5),
        sn,
    )
    theta = longitude * deg_to_rad - olon

    if theta > pi:
        theta -= 2.0 * pi
    elif theta < -pi:
        theta += 2.0 * pi

    theta *= sn

    nx = floor(ra * sin(theta) + XO + 0.5)
    ny = floor(ro - ra * cos(theta) + YO + 0.5)

    return nx, ny