/**
 * 지도 화면을 담당하는 메인 컴포넌트입니다.
 * 웹 환경에서만 동작하며, 네이버 지도 API를 사용해 지도를 표시하고
 * 상단 필터 버튼으로 주변 장소를 검색해 마커로 보여줍니다.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// ==================== 상수 / 타입 ====================

/**
 * 상단에 표시될 필터 버튼 목록입니다.
 * 정부 24와 Q&A는 버튼 클릭 시 외부 사이트로 이동하고,
 * 나머지 버튼은 지도에서 관련 장소를 검색합니다.
 */
const FILTERS = ['주민센터', '운동센터', '지역사업 찾기', '공원', '지하철', '정부 24', 'Q&A'];

/**
 * 실제 지도 검색에 사용되는 필터 타입입니다.
 * 정부 24는 외부 링크로 사용되기 때문에 여기서는 제외합니다.
 */
type PlaceFilter = '주민센터' | '운동센터' | '지역사업 찾기' | '공원' | '지하철' | 'Q&A';

/**
 * 유동인구 밀집 정도를 나타내는 단계입니다.
 */
type DensityLevel = 'low' | 'medium' | 'high' | 'veryHigh';

/**
 * 지도에 표시될 밀집 구역 하나의 데이터 구조입니다.
 * 실제 서비스에서는 서버에서 받아온 구역 정보를 사용합니다.
 */
interface DensityArea {
  id: string;                // 구역 고유 ID
  name: string;              // 구역 이름
  level: DensityLevel;       // 밀집 단계
  population: number;        // 유동인구 수
  coords: { x: number; y: number }[];  // 구역 외곽 좌표들
  center?: { x: number; y: number };   // 구역 중심 좌표 (옵션)
  query?: string;            // 지오코딩 검색어 (옵션)
  radiusMeters?: number;     // 구역 반경 (옵션)
}

/**
 * 지도 마커를 클릭했을 때 하단 정보 바에 표시할 장소 정보 구조입니다.
 */
interface MapPlace {
  name: string;      // 장소 이름
  address: string;   // 주소
  category: string;  // 카테고리 (예: 주민센터, 공원 등)
  x?: number;        // 경도
  y?: number;        // 위도
}

/**
 * 네이버 지역 검색 API로부터 받은 장소 정보 구조입니다.
 * mapx, mapy는 네이버에서 제공하는 좌표 값입니다.
 */
interface SearchPlace {
  name: string;      // 장소 이름
  address: string;   // 주소
  x: number;         // 경도
  y: number;         // 위도
}

/**
 * 필터 검색 결과 요약 정보 구조입니다.
 * 하단 정보 바에 "현재 지도 범위 내 N개 장소" 형태로 표시됩니다.
 */
interface FilterSummary {
  filter: PlaceFilter;  // 어떤 필터로 검색했는지
  count: number;        // 화면 내에 보이는 장소 수
}

/**
 * 밀집 구역 폴리곤을 클릭했을 때 하단 정보 바에 표시할 정보 구조입니다.
 */
interface ClickedDensityArea {
  id: string;           // 구역 ID
  name: string;         // 구역 이름
  level: DensityLevel;  // 밀집 단계
  population: number;   // 유동인구 수
}

// ==================== 검색 키워드 설정 ====================

/**
 * 각 필터 버튼별로 네이버 지역 검색 API에 전달할 검색 키워드 목록입니다.
 * 실제 서비스에서는 버튼마다 적합한 키워드를 설정해 사용합니다.
 * 첫 번째 키워드가 실제 검색에 사용됩니다.
 */
const PLACE_KEYWORDS: Record<PlaceFilter, string[]> = {
  주민센터: ['주민센터', '행정복지센터', '주민자치센터'],
  운동센터: ['체육관', '스포츠센터', '구민체육센터'],
  '지역사업 찾기': ['일자리센터', '평생학습센터', '사회적경제지원센터'],
  공원: ['공원', '근린공원', '도시숲'],
  지하철: ['지하철역', '전철역'],
  'Q&A': [],
};

/**
 * 각 필터별로 하단 정보 바에 표시할 정보입니다.
 * 검색 결과가 없을 때 기본으로 보여주는 텍스트입니다.
 */
const FILTER_INFO: Record<string, { title: string; subtitle: string; timestamp: string }> = {
  주민센터: { title: '주민센터 인근 정보', subtitle: '주민센터 운영 시간 안내 및 생활민원 지원 가능', timestamp: '현재 기준 실시간 반영' },
  운동센터: { title: '운동센터 인근 정보', subtitle: '체육시설, 운동 프로그램, 이용 요금 안내', timestamp: '현재 기준 실시간 반영' },
  '지역사업 찾기': { title: '지역사업 정보', subtitle: '지역 커뮤니티 지원사업 및 참여 가능 프로그램', timestamp: '현재 기준 실시간 반영' },
  공원: { title: '공원 인근 정보', subtitle: '산책로, 휴식 공간, 주변 편의시설 정보', timestamp: '현재 기준 실시간 반영' },
  지하철: { title: '지하철역 정보', subtitle: '주변 지하철 역 간 이동 편의 및 역세권 정보', timestamp: '현재 지도 기준 주변역 표시' },
  'Q&A': { title: 'Q&A 정보', subtitle: '자주 묻는 질문과 민원 처리 안내', timestamp: '현재 기준 실시간 반영' },
};

// ==================== 기본 데이터 ====================

/**
 * 지하철 필터의 기본 검색 키워드 목록입니다.
 */
const DEFAULT_STATION_QUERIES: string[] = PLACE_KEYWORDS['지하철'];

/**
 * 앱 시작 시 지도에 표시할 밀집 구역 기본 데이터입니다.
 * 현재는 빈 배열로 시작하며, 실제 데이터는 서버에서 받아와 설정합니다.
 */
const DEFAULT_DENSITY_AREAS: DensityArea[] = [];

/**
 * 밀집 단계별로 사람이 읽기 쉬운 라벨입니다.
 */
const DENSITY_LABELS: Record<DensityLevel, string> = {
  low: '여유',
  medium: '보통',
  high: '혼잡',
  veryHigh: '매우혼잡',
};

/**
 * 밀집 단계별로 지도 폴리곤에 적용할 색상입니다.
 * rgba의 마지막 값(0.45)은 투명도입니다.
 */
const DENSITY_COLOR_MAP: Record<DensityLevel, string> = {
  low: 'rgba(63, 185, 80, 0.45)',
  medium: 'rgba(246, 183, 60, 0.45)',
  high: 'rgba(242, 139, 48, 0.45)',
  veryHigh: 'rgba(229, 72, 77, 0.45)',
};

/**
 * 네이버 지도/검색 API 인증 정보입니다.
 * .env 파일에 저장된 값을 사용합니다.
 */
const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

// ==================== 헬퍼 함수 ====================

/**
 * 필터 이름에 따라 하단 정보 바에 표시될 카테고리 라벨을 반환합니다.
 * 검색 결과 마커를 클릭했을 때 이 라벨이 사용됩니다.
 */
function getCategoryLabel(filter: string | null): string {
  if (filter === '지하철') return '지하철역';
  if (filter === '공원') return '공원';
  if (filter === '운동센터') return '운동센터';
  if (filter === '주민센터') return '주민센터';
  if (filter === '지역사업 찾기') return '지역사업';
  if (filter === 'Q&A') return '민원/Q&A';
  return '장소';
}

// ==================== 메인 컴포넌트 ====================

export default function MapScreen() {
  // ==================== 참조(Ref) 관리 ====================
  // React 컴포넌트가 다시 렌더링되어도 값이 유지되는 변수들입니다.
  // 주로 지도 객체, 마커 목록, 스크립트 로드 상태 등을 저장합니다.

  /** 지도가 그려질 HTML div 요소를 참조합니다. */
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  /** 네이버 지도 객체 자체를 저장합니다. 지도 생성 후 재사용하기 위해 사용합니다. */
  const naverMapRef = useRef<any>(null);

  /** 현재 지도에 표시된 마커 목록입니다. 마커를 지울 때 한 번에 제거하기 위해 사용합니다. */
  const markersRef = useRef<any[]>([]);

  /** 현재 지도에 표시된 폴리곤 목록입니다. 마찬가지로 일괄 제거용입니다. */
  const polygonsRef = useRef<any[]>([]);

  /** 현재 지도에 표시된 정보창 목록입니다. */
  const infoWindowsRef = useRef<any[]>([]);

  /** 현재 선택된 필터를 저장합니다. 버튼 클릭 시 이 값을 업데이트합니다. */
  const activeFilterRef = useRef<PlaceFilter | null>(null);

  /** 네이버 지도 스크립트가 이미 로드되었는지 여부입니다. 중복 로드를 방지합니다. */
  const naverScriptLoadedRef = useRef<boolean>(false);

  /** 지도 객체가 이미 초기화되었는지 여부입니다. 중복 초기화를 방지합니다. */
  const naverMapInitRef = useRef<boolean>(false);

  /** 검색으로 얻은 결과 목록을 저장합니다. 지도 이동/줌 시 다시 마커를 그리기 위해 사용합니다. */
  const searchResultsRef = useRef<SearchPlace[]>([]);

  // ==================== 상태(State) 관리 ====================
  // 상태가 변경되면 컴포넌트가 다시 렌더링됩니다.

  /** 현재 선택된 필터 버튼의 이름입니다. */
  const [activeFilter, setActiveFilter] = useState<PlaceFilter | null>(null);

  /** 지도 마커를 클릭했을 때 하단 정보 바에 표시할 장소 정보입니다. */
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);

  /** 필터 검색 결과 요약 정보입니다. "현재 지도 범위 내 N개 장소"에 사용됩니다. */
  const [filterSummary, setFilterSummary] = useState<FilterSummary | null>(null);

  /** 지도에 표시할 밀집 구역 목록입니다. 실제 서비스에서는 서버에서 받아옵니다. */
  const [densityAreas, setDensityAreas] = useState<DensityArea[]>(DEFAULT_DENSITY_AREAS);

  /** 밀집 구역 폴리곤을 클릭했을 때 하단 정보 바에 표시할 정보입니다. */
  const [clickedDensityArea, setClickedDensityArea] = useState<ClickedDensityArea | null>(null);

  /** 필터 검색으로 얻은 전체 결과 목록입니다. 화면 표시용으로 bounds 필터링이 적용됩니다. */
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);

  /** 네이버 지도 객체가 생성된 뒤에만 검색을 돌리기 위한 플래그입니다. */
  const [mapReady, setMapReady] = useState(false);

  // ==================== 파생 값 ====================

  /** 모든 밀집 구역의 유동인구 합계입니다. */
  const totalPopulation = useMemo(
    () => densityAreas.reduce((acc, area) => acc + area.population, 0),
    [densityAreas],
  );

  // ==================== 유틸리티 함수 ====================

  /**
   * 지도에 표시된 모든 마커를 제거합니다.
   * 필터를 해제하거나 새로운 검색을 시작하기 전에 호출합니다.
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  /**
   * 지도에 표시된 모든 폴리곤과 정보창을 제거합니다.
   * 밀집 구역을 다시 그리기 전에 호출합니다.
   */
  const clearPolygons = useCallback(() => {
    polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    polygonsRef.current = [];
    infoWindowsRef.current.forEach((iw) => iw.setMap(null));
    infoWindowsRef.current = [];
  }, []);

  /**
   * 필터 검색 결과 요약을 상태에 저장합니다.
   * 마커 개수가 0개면 필터 요약을 초기화합니다.
   */
  const emitSummary = useCallback((count: number) => {
    if (!activeFilterRef.current) {
      setFilterSummary(null);
      return;
    }
    setFilterSummary({ filter: activeFilterRef.current, count });
  }, []);

  // ==================== 지도 렌더링 함수 ====================

  /**
   * 밀집 구역 폴리곤을 지도에 그립니다.
   * 좌표 데이터가 없는 경우 지도 중심 주변에 기본 폴리곤을 생성합니다.
   */
  const renderDensityPolygons = useCallback(() => {
    if (!naverMapRef.current) return;
    const map = naverMapRef.current;
    const w = window as any;
    const naver = w.naver;
    if (!naver || !naver.maps) return;
    clearPolygons();
    if (!densityAreas || densityAreas.length === 0) return;

    const zoom = map.getZoom();
    if (zoom < 11) return;

    densityAreas.forEach((area) => {
      const hasCenter = !!area.center;
      const hasCoords = Array.isArray(area.coords) && area.coords.length > 0;

      /**
       * 좌표도 없고 중심점도 없을 때:
       * 지도 중심 좌표를 기준으로 작은 사각형 폴리곤을 그려
       * 최소한의 시각적 표시가 되도록 합니다.
       */
      if (!hasCenter && !hasCoords) {
        const defaultCenter = map.getCenter();
        const lat = defaultCenter.lat();
        const lng = defaultCenter.lng();
        const offset = 0.01;
        const coords = [
          { x: lng - offset, y: lat - offset },
          { x: lng + offset, y: lat - offset },
          { x: lng + offset, y: lat + offset },
          { x: lng - offset, y: lat + offset },
        ];
        const path = coords.map((coord) => new naver.maps.LatLng(coord.y, coord.x));

        const polygon = new naver.maps.Polygon({
          map,
          paths: path,
          fillColor: DENSITY_COLOR_MAP[area.level] || 'rgba(128, 128, 128, 0.4)',
          fillOpacity: 1,
          strokeColor: 'rgba(255, 255, 255, 0.8)',
          strokeOpacity: 1,
          strokeWeight: 2,
          zIndex: 1,
        });

        const content = `<div class="density-label"><strong>${area.name}</strong> · ${DENSITY_LABELS[area.level]}</div>`;
        const infoWindow = new naver.maps.InfoWindow({
          content,
          anchorColor: 'transparent',
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: 'transparent',
          pixelOffset: new naver.maps.Point(0, 0),
          zIndex: 2,
        });
        infoWindow.open(map, new naver.maps.LatLng(lat, lng));

        naver.maps.Event.addListener(polygon, 'click', () => {
          setClickedDensityArea({ id: area.id, name: area.name, level: area.level, population: area.population });
        });

        polygonsRef.current.push(polygon);
        infoWindowsRef.current.push(infoWindow);
        return;
      }

      /**
       * 중심점만 있고 좌표가 없을 때:
       * 중심점 주변에 작은 사각형 폴리곤을 그립니다.
       */
      if (!hasCoords && hasCenter) {
        const center = area.center!;
        const offset = 0.01;
        const coords = [
          { x: center.x - offset, y: center.y - offset },
          { x: center.x + offset, y: center.y - offset },
          { x: center.x + offset, y: center.y + offset },
          { x: center.x - offset, y: center.y + offset },
        ];
        const path = coords.map((coord) => new naver.maps.LatLng(coord.y, coord.x));

        const polygon = new naver.maps.Polygon({
          map,
          paths: path,
          fillColor: DENSITY_COLOR_MAP[area.level] || 'rgba(128, 128, 128, 0.4)',
          fillOpacity: 1,
          strokeColor: 'rgba(255, 255, 255, 0.8)',
          strokeOpacity: 1,
          strokeWeight: 2,
          zIndex: 1,
        });

        const content = `<div class="density-label"><strong>${area.name}</strong> · ${DENSITY_LABELS[area.level]} (${area.population.toLocaleString()}명)</div>`;
        const infoWindow = new naver.maps.InfoWindow({
          content,
          anchorColor: 'transparent',
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: 'transparent',
          pixelOffset: new naver.maps.Point(0, 0),
          zIndex: 2,
        });
        infoWindow.open(map, new naver.maps.LatLng(center.y, center.x));

        naver.maps.Event.addListener(polygon, 'click', () => {
          setClickedDensityArea({ id: area.id, name: area.name, level: area.level, population: area.population });
        });

        polygonsRef.current.push(polygon);
        infoWindowsRef.current.push(infoWindow);
        return;
      }

      if (!hasCoords) return;

      /**
       * 좌표가 있을 때:
       * 실제 구역 외�선을 따라 폴리곤을 그리고,
       * 중앙에 정보창을 띄웁니다.
       */
      const path = area.coords.map((coord) => new naver.maps.LatLng(coord.y, coord.x));
      const polygon = new naver.maps.Polygon({
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
      const infoWindow = new naver.maps.InfoWindow({
        content,
        anchorColor: 'transparent',
        borderWidth: 0,
        disableAnchor: true,
        backgroundColor: 'transparent',
        pixelOffset: new naver.maps.Point(0, 0),
        zIndex: 2,
      });
      infoWindow.open(map, new naver.maps.LatLng(centerLat, centerLng));

      naver.maps.Event.addListener(polygon, 'click', () => {
        setClickedDensityArea({ id: area.id, name: area.name, level: area.level, population: area.population });
      });

      polygonsRef.current.push(polygon);
      infoWindowsRef.current.push(infoWindow);
    });
  }, [densityAreas, clearPolygons]);

  /**
   * 검색으로 얻은 장소 목록을 지도에 마커로 표시합니다.
   * 현재 지도 화면 범위(bounds) 안에 있는 장소만 마커를 만듭니다.
   */
  const renderSearchMarkers = useCallback((places: SearchPlace[]) => {
    if (!naverMapRef.current) return;
    const map = naverMapRef.current;
    const w = window as any;
    const naver = w.naver;
    if (!naver || !naver.maps) return;
    const filter = activeFilterRef.current;
    clearMarkers();
    if (!filter || !places.length) {
      emitSummary(0);
      return;
    }

    const categoryLabel = getCategoryLabel(filter);
    const bounds = map.getBounds();
    let visibleCount = 0;
    console.log(`[Map] 마커 렌더링 - 장소 수: ${places.length}, 필터: ${filter}`);

    places.forEach((place) => {
      const lat = Number(place.y);
      const lng = Number(place.x);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const latLng = new naver.maps.LatLng(lat, lng);
        const marker = new naver.maps.Marker({
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
        naver.maps.Event.addListener(marker, 'click', () => {
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
        if (bounds.hasLatLng(latLng)) visibleCount += 1;
      }
    });
    emitSummary(visibleCount || places.length);
    console.log(`[Map] 마커 표시 완료 - 표시된 마커 수: ${markersRef.current.length}`);
  }, [clearMarkers, emitSummary]);

  // ==================== 필터 처리 ====================

  /**
   * 필터 상태를 변경하고 지도를 다시 그립니다.
   * 필터가 있으면 마커를, 없으면 밀집 구역을 표시합니다.
   */
  const applyFilter = useCallback((filter: PlaceFilter | null) => {
    activeFilterRef.current = filter;
    if (filter) clearMarkers();
    else {
      clearMarkers();
      renderDensityPolygons();
    }
  }, [clearMarkers, renderDensityPolygons]);

  /**
   * 상단 필터 버튼 클릭 시 호출되는 함수입니다.
   * 정부 24와 Q&A는 외부 웹사이트로 이동하고,
   * 나머지 버튼은 지도 검색 필터로 동작합니다.
   */
  const handleFilterPress = useCallback((filter: string) => {
    console.log('[Map] 버튼 클릭:', filter);

    if (filter === '정부 24') {
      console.log('[Map] 정부 24 외부 링크 이동');
      window.open('https://plus.gov.kr/', '_blank');
      return;
    }

    if (filter === 'Q&A') {
      const qnaNext = activeFilterRef.current === 'Q&A' ? null : 'Q&A';
      console.log('[Map] Q&A 토글:', qnaNext);
      clearMarkers();
      if (!qnaNext) {
        setSelectedPlace(null);
        setFilterSummary(null);
        setSearchResults([]);
        searchResultsRef.current = [];
        renderDensityPolygons();
      } else {
        setSelectedPlace(null);
        setFilterSummary(null);
      }
      activeFilterRef.current = qnaNext;
      setActiveFilter(qnaNext);
      setClickedDensityArea(null);
      return;
    }

    const nextFilter = activeFilterRef.current === filter ? null : (filter as PlaceFilter);
    console.log('[Map] 검색 필터 설정:', nextFilter);
    clearMarkers();
    if (!nextFilter) {
      console.log('[Map] 필터 해제 - 마커 제거');
      setSelectedPlace(null);
      setFilterSummary(null);
      setSearchResults([]);
      searchResultsRef.current = [];
      renderDensityPolygons();
    } else {
      console.log('[Map] 필터 적용:', nextFilter);
      setSelectedPlace(null);
    }
    activeFilterRef.current = nextFilter;
    setActiveFilter(nextFilter);
    setClickedDensityArea(null);
  }, [clearMarkers, renderDensityPolygons]);

  // ==================== 지도 초기화 ====================

  /**
   * 네이버 지도 스크립트를 로드하고 지도를 초기화합니다.
   * 스크립트가 이미 로드된 경우 중복 로드를 방지합니다.
   */
  useEffect(() => {
    const win = window as any;
    const existingScript = document.getElementById('naver-map-script');

    if (existingScript && existingScript.dataset.loaded === 'true') {
      if (!naverMapInitRef.current) {
        const naver = win.naver;
        const container = mapContainerRef.current;
        if (naver && naver.maps && container) {
          naverMapInitRef.current = true;
          const mapOptions = {
            center: new naver.maps.LatLng(37.498095, 127.02761),
            zoom: 13,
            minZoom: 10,
            maxZoom: 19,
          };
          naverMapRef.current = new naver.maps.Map(container, mapOptions);
          setMapReady(true);
          renderDensityPolygons();
          naver.maps.Event.addListener(naverMapRef.current, 'idle', () => {
            if (activeFilterRef.current) renderSearchMarkers(searchResultsRef.current);
            else renderDensityPolygons();
          });
        }
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'naver-map-script';
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.onload = () => {
      script.dataset.loaded = 'true';
      naverScriptLoadedRef.current = true;
      const w = window as any;
      const naver = w.naver;
      if (!naver || !naver.maps) return;
      const container = mapContainerRef.current;
      if (!container || naverMapInitRef.current) return;
      naverMapInitRef.current = true;

      // 지도를 생성하고 기본 위치(강남역 근처)로 설정합니다.
      const mapOptions = {
        center: new naver.maps.LatLng(37.498095, 127.02761),
        zoom: 13,
        minZoom: 10,
        maxZoom: 19,
      };
      naverMapRef.current = new naver.maps.Map(container, mapOptions);
      setMapReady(true);

      // 지도에 밀집 구역 폴리곤을 처음 한 번 그려줍니다.
      renderDensityPolygons();

      // 지도 이동/줌이 끝날 때마다 호출됩니다.
      // 필터가 활성화되어 있으면 검색 결과 마커를 다시 그리고,
      // 필터가 없으면 밀집 구역을 다시 그립니다.
      naver.maps.Event.addListener(naverMapRef.current, 'idle', () => {
        if (activeFilterRef.current) renderSearchMarkers(searchResultsRef.current);
        else renderDensityPolygons();
      });
    };
    script.onerror = () => {
      console.error('[Map] 네이버 지도 스크립트 로드 실패');
    };
    document.head.appendChild(script);
  }, [renderDensityPolygons, renderSearchMarkers]);

  // ==================== 장소 검색 ====================

  /**
   * 필터가 변경될 때마다 서버 프록시(/api/search)로 네이버 지역검색을 호출합니다.
   * 브라우저는 openapi.naver.com CORS를 허용하지 않으므로 서버에서만 검색 API를 호출합니다.
   *
   * 1. 지도 중심 좌표를 reverseGeocode로 시/구 이름을 얻습니다.
   * 2. 지역명 + 키워드로 /api/search 를 호출합니다.
   * 3. mapx/mapy 를 WGS84로 변환한 뒤 마커로 표시합니다.
   */
  useEffect(() => {
    if (!activeFilter || !mapReady || !naverMapRef.current) return;
    const keywords = PLACE_KEYWORDS[activeFilter] || [];
    if (keywords.length === 0) return;

    let cancelled = false;

    function isWgs84(x: number, y: number) {
      return x > 110 && x < 140 && y > 20 && y < 50;
    }

    function toWgs84(rawX: number, rawY: number, naver: any): { x: number; y: number } | null {
      if (Number.isNaN(rawX) || Number.isNaN(rawY)) return null;
      if (isWgs84(rawX, rawY)) return { x: rawX, y: rawY };

      // 최근 지역검색은 경위도 * 10,000,000 정수로 내려오는 경우가 있습니다.
      if (Math.abs(rawX) > 1e7 && Math.abs(rawY) > 1e6) {
        const x = rawX / 1e7;
        const y = rawY / 1e7;
        if (isWgs84(x, y)) return { x, y };
      }

      const Trans = naver?.maps?.TransCoord;
      const Point = naver?.maps?.Point;
      try {
        if (Trans?.fromTM128ToLatLng && Point) {
          const ll = Trans.fromTM128ToLatLng(new Point(rawX, rawY));
          const x = ll.lng();
          const y = ll.lat();
          if (isWgs84(x, y)) return { x, y };
        }
        if (Trans?.fromKATECToLatLng) {
          const ll = Trans.fromKATECToLatLng(rawX, rawY);
          const x = ll.lng();
          const y = ll.lat();
          if (isWgs84(x, y)) return { x, y };
        }
      } catch (convErr) {
        console.warn('[Map] 좌표 변환 실패:', convErr, rawX, rawY);
      }
      return null;
    }

    async function resolveRegion(naver: any, center: any): Promise<string> {
      const Service = naver?.maps?.Service;
      if (!Service || typeof Service.reverseGeocode !== 'function') return '';
      return new Promise<string>((resolve) => {
        Service.reverseGeocode(
          { coords: new naver.maps.LatLng(center.lat(), center.lng()) },
          (status: any, response: any) => {
            try {
              if (status !== Service.Status.OK || !response) {
                resolve('');
                return;
              }
              const v2 = response.v2 || response;
              let area1 = '';
              let area2 = '';
              const results = v2.results;
              if (Array.isArray(results) && results.length > 0) {
                const reg = results[0].region;
                if (reg) {
                  area1 = String(reg.area1?.name || '');
                  area2 = String(reg.area2?.name || '');
                }
              }
              if (!area1 && !area2 && Array.isArray(v2.addressElements)) {
                v2.addressElements.forEach((el: any) => {
                  if (el.types && el.types.includes('SIDO')) area1 = String(el.longName || '');
                  if (el.types && el.types.includes('SIGUGUN')) area2 = String(el.longName || '');
                });
              }
              if (!area1 && !area2) {
                const addrField = v2.address;
                const addrStr = typeof addrField === 'string'
                  ? addrField
                  : typeof v2.jibunAddress === 'string'
                    ? v2.jibunAddress
                    : '';
                const tokens = addrStr.trim().split(/\s+/).filter(Boolean);
                if (tokens.length >= 1) area1 = tokens[0];
                if (tokens.length >= 2) area2 = tokens[1];
              }
              resolve(`${area1} ${area2}`.trim());
            } catch {
              resolve('');
            }
          }
        );
      });
    }

    async function fetchLocalItems(query: string): Promise<any[]> {
      const params = new URLSearchParams({ query });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('[Map] /api/search 실패:', res.status, query, data?.errorCode || data?.error || data?.errorMessage);
        return [];
      }
      return Array.isArray(data.items) ? data.items : [];
    }

    async function search() {
      try {
        const map = naverMapRef.current;
        const center = map.getCenter();
        const w = window as any;
        const naver = w.naver;
        console.log('[Map] 검색 시작 - 중심 좌표:', center.lat(), center.lng());
        if (!naver || !naver.maps) {
          console.error('[Map] naver.maps 로드 안 됨');
          return;
        }

        const region = await resolveRegion(naver, center);
        console.log('[Map] 검색 지역:', region || '(지역명 없음)');

        const queries = keywords.slice(0, 3).map((keyword) => (region ? `${region} ${keyword}` : keyword));
        console.log('[Map] 검색어:', queries);

        const batches = await Promise.all(queries.map((query) => fetchLocalItems(query)));
        const merged = new Map<string, SearchPlace>();

        batches.flat().forEach((it: any) => {
          const rawX = Number(it.mapx ?? it.x ?? it.lng);
          const rawY = Number(it.mapy ?? it.y ?? it.lat);
          const ll = toWgs84(rawX, rawY, naver);
          if (!ll) return;
          const name = String(it.title || it.name || '').replace(/<[^>]*>/g, '');
          const address = String(it.roadAddress || it.address || '');
          const key = `${name}|${ll.x.toFixed(5)}|${ll.y.toFixed(5)}`;
          if (!merged.has(key)) {
            merged.set(key, { name, address, x: ll.x, y: ll.y });
          }
        });

        const places = Array.from(merged.values());
        console.log('[Map] 변환된 장소:', places);

        if (!cancelled) {
          setSearchResults(places);
          searchResultsRef.current = places;
          renderSearchMarkers(places);
        }
      } catch (e) {
        console.error('[Map] 검색 실패:', e);
        if (!cancelled) {
          setSearchResults([]);
          searchResultsRef.current = [];
          renderSearchMarkers([]);
        }
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, mapReady, renderSearchMarkers]);

  // ==================== 하단 정보 바 데이터 ====================

  /**
   * 하단 정보 바에 표시될 정보를 계산합니다.
   * 우선순위: 밀집 구역 클릭 > 마커 클릭 > 필터 요약 > 기본 정보
   */
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

  // ==================== 화면 렌더링 ====================

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F5', height: '100vh' }}>
      {/* 상단 헤더 영역 */}
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>내 주변 확인</div>
        <h1 style={{ fontSize: 22, fontWeight: '800', color: '#111111', margin: 0 }}>지도</h1>
      </div>

      {/* 필터 버튼 영역 */}
      <div style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}>
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

      {/* 지도 영역 */}
      <div style={{ flex: 1, position: 'relative', marginLeft: 16, marginRight: 16, marginBottom: 16, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        {/* 네이버 지도가 렌더링될 div입니다. */}
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', minHeight: 360 }}
        />

        {/* 우측 상단 지도 컨트롤 버튼들 */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
          </button>
          <button style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l6-6"/><path d="M12 2v4"/></svg>
          </button>
        </div>

        {/* 좌측 상단 범례 (필터가 없을 때만 표시) */}
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

        {/* 하단 정보 바 */}
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
