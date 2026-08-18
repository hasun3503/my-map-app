import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

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

// 더 다양한 키워드로 확장
const PLACE_KEYWORDS: Record<PlaceFilter, string[]> = {
  주민센터: [
    '행정동', '주민센터', '행정복지센터', '행정센터', '무더위쉼터', '주민자치센터',
  ],
  운동센터: [
    '체육관', '운동센터', '스포츠센터', '피트니스센터', '구민체육센터',
  ],
  '지역사업 찾기': [
    '일자리센터', '평생학습센터', '지역사업', '복지사업', '사회적경제지원센터',
  ],
  공원: [
    '공원', '근린공원', '쉼터', '광장', '도시숲', '산책로'
  ],
  지하철: [
    '지하철역', '전철역'
  ],
  'Q&A': [
    '민원실', '주민센터', '구청', '국민신문고', '열린민원실'
  ]
};

const FILTER_INFO: Record<string, { title: string; subtitle: string; timestamp: string }> = {
  주민센터: {
    title: '주민센터 인근 정보',
    subtitle: '주민센터 운영 시간 안내 및 생활민원 지원 가능',
    timestamp: '현재 기준 실시간 반영',
  },
  운동센터: {
    title: '운동센터 인근 정보',
    subtitle: '체육시설, 운동 프로그램, 이용 요금 안내',
    timestamp: '현재 기준 실시간 반영',
  },
  '지역사업 찾기': {
    title: '지역사업 정보',
    subtitle: '지역 커뮤니티 지원사업 및 참여 가능 프로그램',
    timestamp: '현재 기준 실시간 반영',
  },
  공원: {
    title: '공원 인근 정보',
    subtitle: '산책로, 휴식 공간, 주변 편의시설 정보',
    timestamp: '현재 기준 실시간 반영',
  },
  지하철: {
    title: '지하철역 정보',
    subtitle: '주변 지하철 역 간 이동 편의 및 역세권 정보',
    timestamp: '현재 지도 기준 주변역 표시',
  },
  'Q&A': {
    title: 'Q&A 정보',
    subtitle: '자주 묻는 질문과 민원 처리 안내',
    timestamp: '현재 기준 실시간 반영',
  },
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

function buildHtml(densityAreas: DensityArea[]) {
  const densityJson = JSON.stringify(densityAreas);
  const placeQueriesJson = JSON.stringify(PLACE_KEYWORDS);
  const clientIdJson = JSON.stringify(clientId);
  const clientSecretJson = JSON.stringify(clientSecret);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
  />
   <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    .density-label {
      background: rgba(255,255,255,0.9);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      color: #333;
      border: 1px solid rgba(0,0,0,0.1);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var markers = [];
    var polygons = [];
    var infoWindows = [];
    var activeFilter = null;
    var densityAreas = ${densityJson};
    var placeQueries = ${placeQueriesJson};
    var clientId = ${clientIdJson};
    var clientSecret = ${clientSecretJson};
    var lastSearchResults = [];

    var DENSITY_COLOR_MAP = {
      low: 'rgba(63, 185, 80, 0.45)',
      medium: 'rgba(246, 183, 60, 0.45)',
      high: 'rgba(242, 139, 48, 0.45)',
      veryHigh: 'rgba(229, 72, 77, 0.45)'
    };

    var DENSITY_LABEL_MAP = {
      low: '여유',
      medium: '보통',
      high: '혼잡',
      veryHigh: '매우혼잡'
    };

    function postToApp(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function clearMarkers() {
      markers.forEach(function (marker) { marker.setMap(null); });
      markers = [];
    }

    function clearPolygons() {
      polygons.forEach(function (polygon) { polygon.setMap(null); });
      polygons = [];
      infoWindows.forEach(function (iw) { iw.setMap(null); });
      infoWindows = [];
    }

    function getCategoryLabel(filter) {
      if (filter === '지하철') return '지하철역';
      if (filter === '공원') return '공원';
      if (filter === '운동센터') return '운동센터';
      if (filter === '주민센터') return '주민센터';
      if (filter === '지역사업 찾기') return '지역사업';
      if (filter === 'Q&A') return '민원/Q&A';
      return '장소';
    }

    function emitSummary(count) {
      if (!activeFilter) {
        postToApp({ type: 'FILTER_SUMMARY', summary: null });
        return;
      }
      postToApp({
        type: 'FILTER_SUMMARY',
        summary: { filter: activeFilter, count: count },
      });
    }

    function renderDensityPolygons() {
      clearPolygons();
      if (!window.naver || !window.naver.maps) return;

      if (!densityAreas || densityAreas.length === 0) return;

      var zoom = map.getZoom();
      if (zoom < 12) return;

      densityAreas.forEach(function (area) {
        var path = area.coords.map(function (coord) {
          return new window.naver.maps.LatLng(coord.y, coord.x);
        });
        var polygon = new window.naver.maps.Polygon({
          map: map,
          paths: path,
          fillColor: DENSITY_COLOR_MAP[area.level] || 'rgba(128, 128, 128, 0.4)',
          fillOpacity: 1,
          strokeColor: 'rgba(255, 255, 255, 0.8)',
          strokeOpacity: 1,
          strokeWeight: 2,
          zIndex: 1,
        });

        var centerLat = 0, centerLng = 0;
        area.coords.forEach(function (c) { centerLat += c.y; centerLng += c.x; });
        centerLat = centerLat / area.coords.length;
        centerLng = centerLng / area.coords.length;

        var content = '<div class="density-label"><strong>' + area.name + '</strong> · ' +
          DENSITY_LABEL_MAP[area.level] + ' (' + area.population.toLocaleString() + '명)</div>';

        var infoWindow = new window.naver.maps.InfoWindow({
          content: content,
          anchorColor: 'transparent',
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: 'transparent',
          pixelOffset: new window.naver.maps.Point(0, 0),
          zIndex: 2,
        });
        infoWindow.open(map, new window.naver.maps.LatLng(centerLat, centerLng));

        window.naver.maps.Event.addListener(polygon, 'click', function () {
          postToApp({
            type: 'DENSITY_AREA_CLICKED',
            area: { id: area.id, name: area.name, level: area.level, population: area.population }
          });
        });

        polygons.push(polygon);
        infoWindows.push(infoWindow);
      });
    }

    function renderSearchMarkers(places) {
      lastSearchResults = places || [];
      clearMarkers();
      if (!lastSearchResults.length || !window.naver || !window.naver.maps || !window.naver.maps.Service) {
        emitSummary(0);
        return;
      }
      var categoryLabel = getCategoryLabel(activeFilter);
      var bounds = map.getBounds();
      var visibleCount = 0;
      var seen = new Set();

      places.forEach(function (place) {
        var lat = Number(place.y);
        var lng = Number(place.x);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          var latLng = new window.naver.maps.LatLng(lat, lng);
          if (bounds.hasLatLng(latLng)) {
            var key = place.address || place.name;
            if (seen.has(key)) return;
            seen.add(key);
            var marker = new window.naver.maps.Marker({
              position: latLng,
              map: map,
              title: place.name,
              zIndex: 10,
              icon: {
                content: "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='10' fill='" + (activeFilter === '주민센터' ? '#4285F4' : activeFilter === '운동센터' ? '#34A853' : activeFilter === '공원' ? '#FFD600' : activeFilter === '지하철' ? '#263B80' : '#666') + "' stroke='#fff' stroke-width='2'/></svg>"
              }
            });
            window.naver.maps.Event.addListener(marker, 'click', function () {
              postToApp({
                type: 'PLACE_SELECTED',
                place: {
                  name: place.name,
                  address: place.address || '주소 정보 없음',
                  category: categoryLabel,
                  x: lng, y: lat,
                },
              });
            });
            markers.push(marker);
            visibleCount += 1;
          }
        }
      });
      emitSummary(visibleCount);
    }

    function applyFilter(filter) {
      activeFilter = filter || null;
      if (activeFilter) clearMarkers();
      else renderDensityPolygons();
    }

    function updateDensityAreas(newAreas) {
      densityAreas = newAreas;
      if (!activeFilter) renderDensityPolygons();
    }

    function receiveMessage(event) {
      try {
        var payload = JSON.parse(event.data);
        if (payload.type === 'SET_FILTER') applyFilter(payload.filter);
        else if (payload.type === 'UPDATE_DENSITY') updateDensityAreas(payload.areas);
        else if (payload.type === 'SEARCH_RESULTS') renderSearchMarkers(payload.places);
      } catch (error) { /* ignore */ }
    }

    window.onload = function () {
      var mapOptions = {
        center: new window.naver.maps.LatLng(37.498095, 127.02761),
        zoom: 13, minZoom: 10, maxZoom: 19,
      };
      map = new window.naver.maps.Map('map', mapOptions);
      renderDensityPolygons();
      window.naver.maps.Event.addListener(map, 'idle', function () {
        if (activeFilter) renderSearchMarkers(lastSearchResults); else renderDensityPolygons();
      });
      document.addEventListener('message', receiveMessage);
      window.addEventListener('message', receiveMessage);
    };
  </script>
</body>
</html>
`;
}

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const naverMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const webPolygonsRef = useRef<any[]>([]);
  const webInfoWindowsRef = useRef<any[]>([]);
  const webActiveFilterRef = useRef<PlaceFilter | null>(null);
  const naverScriptLoadedRef = useRef<boolean>(false);
  const naverMapInitRef = useRef<boolean>(false);

  const webRenderDensityRef = useRef<() => void>(() => {});
  const webRenderFilterRef = useRef<() => void>(() => {});

  const [activeFilter, setActiveFilter] = useState<PlaceFilter | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [filterSummary, setFilterSummary] = useState<FilterSummary | null>(null);
  const [densityAreas, setDensityAreas] = useState<DensityArea[]>(DEFAULT_DENSITY_AREAS);
  const [clickedDensityArea, setClickedDensityArea] = useState<ClickedDensityArea | null>(null);

  const totalPopulation = useMemo(
    () => densityAreas.reduce((acc, area) => acc + area.population, 0),
    [densityAreas],
  );

  const handleFilterPress = useCallback((filter: string) => {
    if (filter === '정부 24') {
      Linking.openURL('https://plus.gov.kr/');
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
      webActiveFilterRef.current = nextFilter;
      return nextFilter;
    });
    setClickedDensityArea(null);
  }, []);

  const getDensityLabel = useCallback((level: DensityLevel): string => {
    return DENSITY_LABELS[level];
  }, []);

  // ============== Native WebView Bridge ==============
  useEffect(() => {
    if (Platform.OS === 'web') return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_FILTER', filter: activeFilter }),
    );
  }, [activeFilter]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'UPDATE_DENSITY', areas: densityAreas }),
    );
  }, [densityAreas]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!activeFilter || !clientId || !clientSecret || !webViewRef.current) return;
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
          webViewRef.current?.postMessage(
            JSON.stringify({ type: 'SEARCH_RESULTS', places, filter: activeFilter }),
          );
        }
      } catch {
        if (!cancelled) {
          webViewRef.current?.postMessage(
            JSON.stringify({ type: 'SEARCH_RESULTS', places: [], filter: activeFilter }),
          );
        }
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, clientId, clientSecret]);

  const onMapMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'PLACE_SELECTED') {
        setSelectedPlace(payload.place);
        setClickedDensityArea(null);
        return;
      }
      if (payload.type === 'FILTER_SUMMARY') {
        setFilterSummary(payload.summary);
        return;
      }
      if (payload.type === 'DENSITY_AREA_CLICKED') {
        setClickedDensityArea(payload.area);
      }
    } catch (error) { /* ignore */ }
  }, []);

  // ============== Web Platform ==============
  const webClearMarkers = useCallback(() => {
    webMarkersRef.current.forEach((m) => m.setMap(null));
    webMarkersRef.current = [];
  }, []);

  const webClearPolygons = useCallback(() => {
    webPolygonsRef.current.forEach((p) => p.setMap(null));
    webPolygonsRef.current = [];
    webInfoWindowsRef.current.forEach((iw) => iw.setMap(null));
    webInfoWindowsRef.current = [];
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const w = window as any;
    if (!w.naver || !w.naver.maps || !w.naver.maps.Service) return;

    const unresolved = densityAreas.filter((a) => !a.center && !!a.query);
    if (unresolved.length === 0) return;

    let updated = false;
    const patches = new Map<string, { x: number; y: number }>();
    let completed = 0;

    unresolved.forEach((area) => {
      w.naver.maps.Service.geocode(
        { query: area.query ?? area.name },
        (status: any, response: any) => {
          completed += 1;
          if (status === w.naver.maps.Service.Status.OK
            && response.v2
            && response.v2.addresses
            && response.v2.addresses.length > 0) {
            const item = response.v2.addresses[0];
            const x = Number(item.x);
            const y = Number(item.y);
            if (!Number.isNaN(x) && !Number.isNaN(y)) {
              patches.set(area.id, { x, y });
              updated = true;
            }
          }
          if (completed === unresolved.length && updated) {
            setDensityAreas((prev) => prev.map((a) => {
              const p = patches.get(a.id);
              if (p) return { ...a, center: { x: p.x, y: p.y } };
              return a;
            }));
          }
        },
      );
    });
  }, [densityAreas]);

  const webRenderDensityPolygons = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const w = window as any;
    if (!w.naver || !w.naver.maps || !naverMapRef.current) return;

    const areasWithCenter = densityAreas.filter((a) => !!a.center);
    if (areasWithCenter.length === 0) {
      webClearPolygons();
      return;
    }

    const map = naverMapRef.current;
    const zoom = map.getZoom();
    if (zoom < 11) {
      webClearPolygons();
      return;
    }
    webClearPolygons();

    areasWithCenter.forEach((area) => {
      const center = area.center!;
      const radius = area.radiusMeters ?? 1000;
      const circle = new w.naver.maps.Circle({
        map,
        center: new w.naver.maps.LatLng(center.y, center.x),
        radius,
        fillColor: DENSITY_COLOR_MAP[area.level] || 'rgba(128,128,128,0.4)',
        fillOpacity: 1,
        strokeColor: 'rgba(255,255,255,0.8)',
        strokeOpacity: 1,
        strokeWeight: 2,
        zIndex: 1,
      });

      const popText = area.population > 0 ? ` (${area.population.toLocaleString()}명)` : '';
      const content = `<div class="density-label" style="background: rgba(255,255,255,0.9); border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #333; border: 1px solid rgba(0,0,0,0.1); white-space: nowrap;"><strong>${area.name}</strong> · ${DENSITY_LABELS[area.level]}${popText}</div>`;

      const infoWindow = new w.naver.maps.InfoWindow({
        content,
        anchorColor: 'transparent',
        borderWidth: 0,
        disableAnchor: true,
        backgroundColor: 'transparent',
        pixelOffset: new w.naver.maps.Point(0, 0),
        zIndex: 2,
      });
      infoWindow.open(map, new w.naver.maps.LatLng(center.y, center.x));

      w.naver.maps.Event.addListener(circle, 'click', () => {
        setClickedDensityArea({
          id: area.id, name: area.name, level: area.level, population: area.population,
        });
      });

      webPolygonsRef.current.push(circle);
      webInfoWindowsRef.current.push(infoWindow);
    });
  }, [densityAreas, webClearPolygons]);

  useEffect(() => {
    webRenderDensityRef.current = webRenderDensityPolygons;
  }, [webRenderDensityPolygons]);

  const webEmitSummary = useCallback((count: number) => {
    const filter = webActiveFilterRef.current;
    if (!filter) {
      setFilterSummary(null);
      return;
    }
    setFilterSummary({ filter, count });
  }, []);

  const webRenderFilterMarkers = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const w = window as any;
    if (!w.naver || !w.naver.maps || !w.naver.maps.Service || !naverMapRef.current) {
      webEmitSummary(0);
      return;
    }
    const map = naverMapRef.current;
    const filter = webActiveFilterRef.current;
    webClearMarkers();
    if (!filter) { webEmitSummary(0); return; }
    const keywords = PLACE_KEYWORDS[filter] || [];
    if (keywords.length === 0) { webEmitSummary(0); return; }

    const categoryLabel = getCategoryLabel(filter);
    const bounds = map.getBounds();
    let visibleCount = 0;
    let completed = 0;
    const center = map.getCenter();

    function placeMarker(name, address, lat, lng) {
      lat = Number(lat);
      lng = Number(lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const latLng = new w.naver.maps.LatLng(lat, lng);
        if (bounds.hasLatLng(latLng)) {
          const marker = new w.naver.maps.Marker({
            position: latLng,
            map,
            title: name,
            zIndex: 10,
            icon: {
              content: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='10' fill='${
                filter === '주민센터'
                  ? '#4285F4'
                  : filter === '운동센터'
                    ? '#34A853'
                    : filter === '공원'
                      ? '#FFD600'
                      : filter === '지하철'
                        ? '#263B80'
                        : '#666'
              }' stroke='#fff' stroke-width='2'/></svg>`,
            },
          });
          w.naver.maps.Event.addListener(marker, 'click', () => {
            setSelectedPlace({
              name,
              address: address || '주소 정보 없음',
              category: categoryLabel,
              x: lng,
              y: lat,
            });
            setClickedDensityArea(null);
          });
          webMarkersRef.current.push(marker);
          visibleCount += 1;
        }
      }
    }

    w.naver.maps.Service.geocode(
      {
        query: center.y + ',' + center.x,
        coordinate: center.y + ',' + center.x,
        orders: 'addr',
        count: 1,
      },
      (status: any, response: any) => {
        if (
          status !== w.naver.maps.Service.Status.OK
          || !response
          || !response.v2
          || !response.v2.addresses
          || response.v2.addresses.length === 0
        ) {
          webEmitSummary(0);
          return;
        }
        const centerAddr = response.v2.addresses[0];
        let sido = '';
        let sigugun = '';
        let dongmyun = '';
        (centerAddr.addressElements || []).forEach((el: any) => {
          (el.types || []).forEach((t: string) => {
            if (t === 'SIDO') sido = el.longName || '';
            if (t === 'SIGUGUN') sigugun = el.longName || '';
            if (t === 'DONGMYUN') dongmyun = el.longName || '';
          });
        });
        const region = [sido, sigugun, dongmyun].filter(Boolean).join(' ');

        let remaining = keywords.length;
        keywords.forEach((keyword) => {
          const combined = region ? region + ' ' + keyword : keyword;
          w.naver.maps.Service.geocode(
            { query: combined, coordinate: `${center.y},${center.x}`, count: 20 },
            (status: any, response: any) => {
              remaining -= 1;
              if (
                status === w.naver.maps.Service.Status.OK
                && response
                && response.v2
                && response.v2.addresses
                && response.v2.addresses.length > 0
              ) {
                response.v2.addresses.forEach((item: any) => {
                  const lat = Number(item.y);
                  const lng = Number(item.x);
                  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                    placeMarker(keyword, item.roadAddress || item.jibunAddress || '', lat, lng);
                  }
                });
              }
              if (remaining === 0) webEmitSummary(visibleCount);
            },
          );
        });
      },
    );
  }, [webClearMarkers, webEmitSummary]);

  useEffect(() => {
    webRenderFilterRef.current = webRenderFilterMarkers;
  }, [webRenderFilterMarkers]);

  const webApplyFilter = useCallback((filter: PlaceFilter | null) => {
    webActiveFilterRef.current = filter;
    if (filter) webClearPolygons();
    else webRenderDensityRef.current();
    webRenderFilterRef.current();
  }, [webClearPolygons]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    webApplyFilter(activeFilter);
  }, [activeFilter, webApplyFilter]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (naverMapInitRef.current) {
      webRenderDensityRef.current();
      if (webActiveFilterRef.current) webRenderFilterRef.current();
    }
  }, [densityAreas]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const w = window as any;

    const loadScript = () => {
      if (naverScriptLoadedRef.current && w.naver && w.naver.maps) {
        initMap();
        return;
      }
      const existing = document.getElementById('naver-map-script') as HTMLScriptElement | null;
      if (existing) {
        const onReady = () => {
          naverScriptLoadedRef.current = true;
          initMap();
        };
        if (naverMapInitRef.current) return;
        existing.onload = onReady;
        if (existing.dataset.loaded === 'true') onReady();
        return;
      }
      const script = document.createElement('script');
      script.id = 'naver-map-script';
      script.type = 'text/javascript';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
      script.onload = () => {
        script.dataset.loaded = 'true';
        naverScriptLoadedRef.current = true;
        initMap();
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (naverMapInitRef.current) return;
      if (!mapDivRef.current) return;
      naverMapInitRef.current = true;
      const mapEl = document.createElement('div');
      mapEl.style.width = '100%';
      mapEl.style.height = '100%';
      mapDivRef.current.innerHTML = '';
      mapDivRef.current.appendChild(mapEl);

      const mapOptions = {
        center: new w.naver.maps.LatLng(37.498095, 127.02761),
        zoom: 13,
        minZoom: 10,
        maxZoom: 19,
      };
      naverMapRef.current = new w.naver.maps.Map(mapEl, mapOptions);
      webRenderDensityRef.current();
      w.naver.maps.Event.addListener(naverMapRef.current, 'idle', () => {
        if (webActiveFilterRef.current) webRenderFilterRef.current();
        else webRenderDensityRef.current();
      });
    };

    const rafId = requestAnimationFrame(() => loadScript());
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ============== UI Assembly ==============
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
        subtitle: `${getDensityLabel(clickedDensityArea.level)} · 약 ${clickedDensityArea.population.toLocaleString()}명`,
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
  }, [clickedDensityArea, selectedPlace, activeFilter, filterSummary, defaultInfo, getDensityLabel]);

  const html = useMemo(() => buildHtml(densityAreas), [densityAreas]);

  const mapContent = Platform.OS === 'web' ? (
    <div
      ref={mapDivRef as any}
      style={{ width: '100%', height: '100%', backgroundColor: COLORS.card }}
    />
  ) : (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html }}
      style={{ flex: 1 }}
      onMessage={onMapMessage}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader location="서울특별시 강남구" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isSelected = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => handleFilterPress(f)}
            >
              <Text style={styles.filterText}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1 }}>
            {mapContent}
          </View>
        ) : (
          mapContent
        )}

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="locate-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="compass-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {!activeFilter && (
          <View style={styles.legendCard}>
            <LegendDot color={COLORS.green} label="여유" />
            <LegendDot color={COLORS.yellow} label="보통" />
            <LegendDot color={COLORS.orange} label="혼잡" />
            <LegendDot color={COLORS.red} label="매우혼잡" />
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{info.title}</Text>
            <Text style={styles.infoSubtitle}>{info.subtitle}</Text>
            <Text style={styles.infoTimestamp}>{info.timestamp}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  filterChipSelected: {
    backgroundColor: 'rgba(17, 17, 17, 0.06)',
  },
  filterText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  mapArea: {
    flex: 1,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    position: 'relative',
  },
  mapActions: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 10,
  },
  mapActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendCard: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    gap: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
  infoCard: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: COLORS.cardAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    zIndex: 10,
  },
  infoThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  infoTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  infoSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  infoTimestamp: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
