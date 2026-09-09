export interface LatLngLiteral {
  lat: number;
  lng: number;
}

let loadPromise: Promise<void> | null = null;

/** index.html에서 autoload=false로 로드한 카카오맵 SDK를 초기화합니다. 여러 번 호출해도 한 번만 로드합니다. */
export function loadKakaoMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!window.kakao?.maps) {
      reject(new Error('카카오맵 SDK 스크립트가 로드되지 않았습니다.'));
      return;
    }
    window.kakao.maps.load(() => resolve());
  });

  return loadPromise;
}

/** 주소를 좌표로 변환합니다. 검색 결과가 없으면 null을 반환합니다. */
export function geocodeAddress(address: string): Promise<LatLngLiteral | null> {
  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
        return;
      }
      if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        resolve(null);
        return;
      }
      reject(new Error('주소 검색에 실패했습니다.'));
    });
  });
}

const ROADVIEW_SEARCH_RADII_METERS = [50, 300, 1000];

/** 좌표 주변에서 가장 가까운 로드뷰 파노라마 ID를 찾습니다. 반경을 넓혀가며 최대 3회 재시도합니다. */
export async function findNearestPanoId(position: LatLngLiteral): Promise<number | null> {
  const client = new window.kakao.maps.RoadviewClient();
  const latlng = new window.kakao.maps.LatLng(position.lat, position.lng);

  for (const radius of ROADVIEW_SEARCH_RADII_METERS) {
    const panoId = await new Promise<number | null>((resolve) => {
      client.getNearestPanoId(latlng, radius, (id) => resolve(id));
    });
    if (panoId != null) return panoId;
  }
  return null;
}
