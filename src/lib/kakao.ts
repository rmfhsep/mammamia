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
