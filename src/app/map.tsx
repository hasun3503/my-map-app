import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const FILTERS = ['주민센터', '운동센터', '지역사업 찾기', '공원', '지하철', '정부 24', 'Q&A'];

type PlaceFilter = '주민센터' | '운동센터' | '지역사업 찾기' | '공원' | '지하철' | 'Q&A';

type DensityLevel = 'low' | 'medium' | 'high' | 'veryHigh';

interface DensityArea {
  id: string;
  name: string;
  level: DensityLevel;
  population: number;
  coords: { x: number; y: number }[];
  center?: { x: number; y: number };
  query?: string;
  radiusMeters?: number;
}

interface MapPlace {
  name: string;
  address: string;
  category: string;
  x?: number;
  y?: number;
}

interface SearchPlace {
  name: string;
  address: string;
  x: number;
  y: number;
}

interface FilterSummary {
  filter: PlaceFilter;
  count: number;
}

interface ClickedDensityArea {
  id: string;
  name: string;
  level: DensityLevel;
  population: number;
}

const PLACE_KEYWORDS: Record<PlaceFilter, string[]> = {
  주민센터: ['행정동', '주민센터', '행정복지센터', '행정센터', '무더위쉼터', '주민자치센터'],
  운동센터: ['체육관', '운동센터', '스포츠센터', '피트니스센터', '구민체육센터'],
  '지역사업 찾기': ['일자리센터', '평생학습센터', '지역사업', '복지사업', '사회적경제지원센터'],
  공원: ['공원', '근린공원', '쉼터', '광장', '도시숲', '산책로'],
  지하철: ['지하철역', '전철역'],
  'Q&A': ['민원실', '주민센터', '구청', '국민신문고', '열린민원실'],
};

const FILTER_INFO: Record<string, { title: string; subtitle: string; timestamp: string }> = {
  주민센터: { title: '주민센터 인근 정보', subtitle: '주민센터 운영 시간 안내 및 생활민원 지원 가능', timestamp: '현재 기준 실시간 반영' },
  운동센터: { title: '운동센터 인근 정보', subtitle: '체육시설, 운동 프로그램, 이용 요금 안내', timestamp: '현재 기준 실시간 반영' },
  '지역사업 찾기': { title: '지역사업 정보', subtitle: '지역 커뮤니티 지원사업 및 참여 가능 프로그램', timestamp: '현재 기준 실시간 반영' },
  공원: { title: '공원 인근 정보', subtitle: '산책로, 휴식 공간, 주변 편의시설 정보', timestamp: '현재 기준 실시간 반영' },
  지하철: { title: '지하철역 정보', subtitle: '주변 지하철 역 간 이동 편의 및 역세권 정보', timestamp: '현재 지도 기준 주변역 표시' },
  'Q&A': { title: 'Q&A 정보', subtitle: '자주 묻는 질문과 민원 처리 안내', timestamp: '현재 기준 실시간 반영' },
};

const DEFAULT_STATION_QUERIES: string[] = PLACE_KEYWORDS['지하철'];

const DEFAULT_DENSITY_AREAS: DensityArea[] = DEFAULT_STATION_QUERIES.map((name, idx) => ({
  id: `subway-${idx}-${name}`,
  name,
  level: 'medium',
  population: 0,
  coords: [],
  query: name,
  radiusMeters: 1000,
}));

const DENSITY_LABELS: Record<DensityLevel, string> = {
  low: '여유',
  medium: '보통',
  high: '혼잡',
  veryHigh: '매우혼잡',
};

const DENSITY_COLOR_MAP: Record<DensityLevel, string> = {
  low: 'rgba(63, 185, 80, 0.45)',
  medium: 'rgba(246, 183, 60, 0.45)',
  high: 'rgba(242, 139, 48, 0.45)',
  veryHigh: 'rgba(229, 72, 77, 0.45)',
};

const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';
const clientSecret = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_SECRET ?? '';

function getCategoryLabel(filter: string | null): string {
  if (filter === '지하철') return '지하철역';
  if (filter === '공원') return '공원';
  if (filter === '운동센터') return '운동센터';
  if (filter === '주민센터') return '주민센터';
  if (filter === '지역사업 찾기') return '지역사업';
  if (filter === 'Q&A') return '민원/Q&A';
  return '장소';
}

export default function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const naverMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const activeFilterRef = useRef<PlaceFilter | null>(null);
  const naverScriptLoadedRef = useRef<boolean>(false);
  const naverMapInitRef = useRef<boolean>(false);

  const [activeFilter, setActiveFilter] = useState<PlaceFilter | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [filterSummary, setFilterSummary] = useState<FilterSummary | null>(null);
  const [densityAreas, setDensityAreas] = useState<DensityArea[]>(DEFAULT_DENSITY_AREAS);
  const [clickedDensityArea, setClickedDensityArea] = useState<ClickedDensityArea | null>(null);

  const totalPopulation = useMemo(
    () => densityAreas.reduce((acc, area) => acc + area.population, 0),
    [densityAreas],
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const clearPolygons = useCallback(() => {
    polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    polygonsRef.current = [];
    infoWindowsRef.current.forEach((iw) => iw.setMap(null));
    infoWindowsRef.current = [];
  }, []);

  const emitSummary = useCallback((count: number) => {
    if (!activeFilterRef.current) {
      setFilterSummary(null);
      return;
    }
    setFilterSummary({ filter: activeFilterRef.current, count });
  }, []);

  const renderDensityPolygons = useCallback(() => {
    if (!naverMapRef.current) return;
    const map = naverMapRef.current;
    clearPolygons();
    if (!densityAreas || densityAreas.length === 0) return;

    const zoom = map.getZoom();
    if (zoom < 12) return;

    densityAreas.forEach((area) => {
      const path = area.coords.map((coord) => new window.naver.maps.LatLng(coord.y, coord.x));
      const polygon = new window.naver.maps.Polygon({
        map,
        paths: path,
        fillColor: DENSITY_COLOR_MAP[area.level] || 'rgba(128, 128, 128, 0.4)',
        fillOpacity: 1,
        strokeColor: 'rgba(255, 255, 255, 0.8)',
        strokeOpacity: 1,
        strokeWeight: 2,
        zIndex: 1,
      });

      const centerLat = area.coords.reduce((acc, c) => acc + c.y, 0) / area.coords.length;
      const centerLng = area.coords.reduce((acc, c) => acc + c.x, 0) / area.coords.length;

      const content = `<div class="density-label"><strong>${area.name}</strong> · ${DENSITY_LABELS[area.level]} (${area.population.toLocaleString()}명)</div>`;

      const infoWindow = new window.naver.maps.InfoWindow({
        content,
        anchorColor: 'transparent',
        borderWidth: 0,
        disableAnchor: true,
        backgroundColor: 'transparent',
        pixelOffset: new window.naver.maps.Point(0, 0),
        zIndex: 2,
      });
      infoWindow.open(map, new window.naver.maps.LatLng(centerLat, centerLng));

      window.naver.maps.Event.addListener(polygon, 'click', () => {
        setClickedDensityArea({ id: area.id, name: area.name, level: area.level, population: area.population });
      });

      polygonsRef.current.push(polygon);
      infoWindowsRef.current.push(infoWindow);
    });
  }, [densityAreas, clearPolygons]);

  const renderSearchMarkers = useCallback((places: SearchPlace[]) => {
    if (!naverMapRef.current) return;
    const map = naverMapRef.current;
    const filter = activeFilterRef.current;
    clearMarkers();
    if (!filter || !places.length) {
      emitSummary(0);
      return;
    }

    const categoryLabel = getCategoryLabel(filter);
    const bounds = map.getBounds();
    let visibleCount = 0;

    places.forEach((place) => {
      const lat = Number(place.y);
      const lng = Number(place.x);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const latLng = new window.naver.maps.LatLng(lat, lng);
        if (bounds.hasLatLng(latLng)) {
          const marker = new window.naver.maps.Marker({
            position: latLng,
            map,
            title: place.name,
            zIndex: 10,
            icon: {
              content: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='10' fill='${
                filter === '주민센터' ? '#4285F4' : filter === '운동센터' ? '#34A853' : filter === '공원' ? '#FFD600' : filter === '지하철' ? '#263B80' : '#666'
              }' stroke='#fff' stroke-width='2'/></svg>`,
            },
          });
          window.naver.maps.Event.addListener(marker, 'click', () => {
            setSelectedPlace({
              name: place.name,
              address: place.address || '주소 정보 없음',
              category: categoryLabel,
              x: lng,
              y: lat,
            });
            setClickedDensityArea(null);
          });
          markersRef.current.push(marker);
          visibleCount += 1;
        }
      }
    });
    emitSummary(visibleCount);
  }, [clearMarkers, emitSummary]);

  const applyFilter = useCallback((filter: PlaceFilter | null) => {
    activeFilterRef.current = filter;
    if (filter) clearMarkers();
    else renderDensityPolygons();
  }, [clearMarkers, renderDensityPolygons]);

  const handleFilterPress = useCallback((filter: string) => {
    if (filter === '정부 24') {
      window.open('https://plus.gov.kr/', '_blank');
      return;
    }
    setActiveFilter((prev) => {
      const nextFilter = prev === filter ? null : (filter as PlaceFilter);
      if (!nextFilter) {
        setSelectedPlace(null);
        setFilterSummary(null);
      } else {
        setSelectedPlace(null);
      }
      applyFilter(nextFilter);
      return nextFilter;
    });
    setClickedDensityArea(null);
  }, [applyFilter]);

  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'naver-map-script';
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.onload = () => {
      script.dataset.loaded = 'true';
      naverScriptLoadedRef.current = true;
      if (!naverMapInitRef.current && mapContainerRef.current) {
        naverMapInitRef.current = true;
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.498095, 127.02761),
          zoom: 13,
          minZoom: 10,
          maxZoom: 19,
        };
        naverMapRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);
        renderDensityPolygons();
        window.naver.maps.Event.addListener(naverMapRef.current, 'idle', () => {
          if (activeFilterRef.current) renderSearchMarkers([]);
          else renderDensityPolygons();
        });
      }
    };
    document.head.appendChild(script);
  }, [renderDensityPolygons, renderSearchMarkers]);

  useEffect(() => {
    if (!activeFilter || !clientId || !clientSecret) return;
    const keywords = PLACE_KEYWORDS[activeFilter] || [];
    if (keywords.length === 0) return;

    let cancelled = false;

    async function search() {
      try {
        const first = await fetch(
          'https://openapi.naver.com/v1/search/local.json?query=' + encodeURIComponent(keywords[0]) + '&display=15&sort=random',
          { headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret } },
        );
        const data = await first.json();
        const places: SearchPlace[] = (data.items || [])
          .slice(0, 15)
          .map((item: any) => ({
            name: item.title || keywords[0],
            address: item.roadAddress || item.address || '',
            x: Number(item.mapx),
            y: Number(item.mapy),
          }))
          .filter((p: SearchPlace) => !Number.isNaN(p.x) && !Number.isNaN(p.y));

        if (!cancelled) {
          renderSearchMarkers(places);
        }
      } catch {
        if (!cancelled) {
          renderSearchMarkers([]);
        }
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, clientId, clientSecret, renderSearchMarkers]);

  const defaultInfo = useMemo(
    () => ({
      title: '서울특별시 강남구 인근',
      subtitle: `예상 유동인구 67명 (총 ${totalPopulation.toLocaleString()}명)`,
      timestamp: new Date().toLocaleString('ko-KR') + ' 기준',
    }),
    [totalPopulation],
  );

  const info = useMemo(() => {
    if (clickedDensityArea) {
      return {
        title: clickedDensityArea.name,
        subtitle: `${getCategoryLabel(clickedDensityArea.level)} · 약 ${clickedDensityArea.population.toLocaleString()}명`,
        timestamp: '밀집 구역 선택 정보',
      };
    }
    if (selectedPlace) {
      return {
        title: selectedPlace.name,
        subtitle: `${selectedPlace.category} · ${selectedPlace.address}`,
        timestamp: '마커 선택 정보',
      };
    }
    if (activeFilter && filterSummary) {
      return {
        title: FILTER_INFO[activeFilter].title,
        subtitle: `현재 지도 범위 내 ${filterSummary.count}개 장소`,
        timestamp: FILTER_INFO[activeFilter].timestamp,
      };
    }
    return defaultInfo;
  }, [clickedDensityArea, selectedPlace, activeFilter, filterSummary, defaultInfo]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F5', height: '100vh' }}>
      <div style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>내 주변 확인</div>
        <h1 style={{ fontSize: 22, fontWeight: '800', color: '#111111', margin: 0 }}>지도</h1>
      </div>

      <div style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
        {FILTERS.map((f) => {
          const isSelected = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => handleFilterPress(f)}
              style={{
                border: '1px solid rgba(17, 17, 17, 0.08)',
                borderRadius: 999,
                padding: '6px 14px',
                backgroundColor: isSelected ? 'rgba(17, 17, 17, 0.06)' : 'transparent',
                color: '#111111',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, position: 'relative', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', minHeight: 360 }}
        />

        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
          </button>
          <button style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l6-6"/><path d="M12 2v4"/></svg>
          </button>
        </div>

        {!activeFilter && (
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(0,0,0,0.05)', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3FB950' }} />
              <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500 }}>여유</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F6B73C' }} />
              <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500 }}>보통</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F28B30' }} />
              <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500 }}>혼잡</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5484D' }} />
              <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500 }}>매우혼잡</span>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center', zIndex: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>{info.title}</div>
            <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{info.subtitle}</div>
            <div style={{ fontSize: 11, color: '#9A9A9A', marginTop: 2 }}>{info.timestamp}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
