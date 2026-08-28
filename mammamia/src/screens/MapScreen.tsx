import { useEffect, useRef, useState } from 'react';
import { FullScreenLoader, useToast } from '@toss/tds-mobile';
import { loadKakaoMaps } from '../lib/kakao';
import { useNearbyCafes, type Cafe } from '../lib/queries/useCafes';
import { CafeListSheet } from './CafeListSheet';
import './MapScreen.css';

// 위치 권한이 없거나 실패했을 때 쓰는 폴백 좌표 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
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
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // 권한 거부/실패 시 기본 좌표(서울시청) 그대로 사용
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapRef.current) return;
    mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 4,
    });
    // 지도는 최초 1회만 생성합니다 — center 변경은 아래 별도 effect의 setCenter로 반영해요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  useEffect(() => {
    mapRef.current?.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center]);

  const cafesQuery = useNearbyCafes(
    sdkReady ? { lat: center.lat, lng: center.lng, radiusKm: 2 } : null,
  );
  const cafesLoading = !cafesQuery.data;

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
      openToast('반경 2km 안에 등록된 카페가 아직 없어요');
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
