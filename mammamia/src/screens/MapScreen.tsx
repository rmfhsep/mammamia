import { useEffect, useRef, useState } from 'react';
import { Button, FullScreenLoader, useToast } from '@toss/tds-mobile';
import { loadKakaoMaps } from '../lib/kakao';
import { useNearbyCafes, type Cafe } from '../lib/queries/useCafes';
import { CafeListSheet } from './CafeListSheet';
import './MapScreen.css';

// 위치 권한이 없거나 실패했을 때 쓰는 폴백 좌표 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
// 지도 중심이 검색 기준점에서 이만큼(km) 벗어나야 "이 지역 재검색" 버튼을 노출
const RESEARCH_DISTANCE_KM = 0.3;

type LatLng = { lat: number; lng: number };

function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  // geoCenter: 내 위치 기반으로 지도를 이동시키는 좌표 (최초 1회 + 위치 갱신 시에만 사용)
  const [geoCenter, setGeoCenter] = useState(DEFAULT_CENTER);
  // searchCenter: 실제 카페 조회 기준점. "이 지역 재검색" 클릭 시에만 바뀌며, 지도를 움직이지 않음
  const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
  // mapCenter: 드래그/줌 후 지도가 실제로 보여주고 있는 중심 좌표 (재검색 버튼 노출 판단용)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [sdkReady, setSdkReady] = useState(false);
  const { openToast } = useToast();

  useEffect(() => {
    loadKakaoMaps()
      .then(() => setSdkReady(true))
      .catch((err) => console.error('카카오맵 SDK 로드 실패', err));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoCenter(here);
        setSearchCenter(here);
        setMapCenter(here);
      },
      () => {
        // 권한 거부/실패 시 기본 좌표(서울시청) 그대로 사용
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapRef.current) return;
    const map = new window.kakao.maps.Map(mapContainerRef.current, {
      center: new window.kakao.maps.LatLng(geoCenter.lat, geoCenter.lng),
      level: 4,
    });
    mapRef.current = map;

    const handleIdle = () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.getLat(), lng: c.getLng() });
    };
    window.kakao.maps.event.addListener(map, 'idle', handleIdle);
    return () => window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
    // 지도는 최초 1회만 생성합니다 — geoCenter 변경은 아래 별도 effect의 setCenter로 반영해요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  useEffect(() => {
    mapRef.current?.setCenter(new window.kakao.maps.LatLng(geoCenter.lat, geoCenter.lng));
  }, [geoCenter]);

  const cafesQuery = useNearbyCafes(
    sdkReady ? { lat: searchCenter.lat, lng: searchCenter.lng, radiusKm: 2 } : null,
  );
  const cafesLoading = !cafesQuery.data;
  const showResearchButton = distanceKm(mapCenter, searchCenter) > RESEARCH_DISTANCE_KM;

  function handleResearch() {
    setSearchCenter(mapCenter);
  }

  useEffect(() => {
    if (!mapRef.current || !cafesQuery.data) return;

    for (const marker of markersRef.current) marker.setMap(null);

    markersRef.current = cafesQuery.data.map(
      (cafe) =>
        new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(cafe.lat, cafe.lng),
          map: mapRef.current!,
          title: cafe.name,
        }),
    );

    if (cafesQuery.data.length === 0) {
      openToast('반경 2km 안에 등록된 수유실이 아직 없어요');
    }
    // openToast는 매 렌더 새 함수일 수 있어 의존성에서 제외합니다 — cafesQuery.data가 바뀔 때만 체크하면 충분해요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafesQuery.data]);

  function handleSelectCafe(cafe: Cafe) {
    mapRef.current?.panTo(new window.kakao.maps.LatLng(cafe.lat, cafe.lng));
  }

  return (
    <div className="map-screen">
      <div ref={mapContainerRef} className="map-container" />
      {!sdkReady && <FullScreenLoader label="지도를 불러오는 중..." />}
      {sdkReady && showResearchButton && (
        <div className="map-research-button">
          <Button color="dark" variant="fill" size="small" display="inline" onClick={handleResearch}>
            이 지역 재검색
          </Button>
        </div>
      )}
      {sdkReady && (
        <CafeListSheet
          cafes={cafesQuery.data ?? []}
          loading={cafesLoading}
          onSelect={handleSelectCafe}
        />
      )}
    </div>
  );
}
