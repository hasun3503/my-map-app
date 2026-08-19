// src/context/MapContext.tsx
import React, {createContext, useContext, useRef, useState, useCallback} from 'react';

interface Ctx {
  map: naver.maps.Map | null;
  setMap: (m: naver.maps.Map) => void;
  clearMarkers: () => void;
  addMarkers: (places: NaverPlace[], onClick: (p: NaverPlace)=>void) => void;
}

const MapContext = createContext<Ctx>(/* ... */);

export const MapProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [map, setMap] = useState<naver.maps.Map|null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const addMarkers = useCallback((places, onClick) => {
    if (!map) return;
    clearMarkers();
    const newMarkers = places.map(p => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(p.y, p.x),
        map,
        icon: '/img/pin-default.svg', // 표 아이콘
      });
      naver.maps.Event.addListener(marker, 'click', () => onClick(p));
      return marker;
    });
    markersRef.current = newMarkers;
    // 범위 맞추기
    const bounds = new naver.maps.LatLngBounds();
    newMarkers.forEach(m => bounds.extend(m.getPosition()));
    map.fitBounds(bounds);
  }, [map]);

  return (
    <MapContext.Provider value={{map,setMap,clearMarkers,addMarkers}}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);