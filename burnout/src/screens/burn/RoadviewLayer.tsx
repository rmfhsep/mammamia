import { useEffect, useRef } from 'react';
import type { LatLngLiteral } from '../../lib/kakao';

interface RoadviewLayerProps {
  panoId: number;
  position: LatLngLiteral;
  /** true면 드래그로 둘러보기/이동이 가능하고, false면 지금 보이는 화면을 그대로 고정합니다. */
  interactive: boolean;
  onReady?: () => void;
}

/**
 * 카카오 로드뷰를 화면 전체에 배경으로 띄웁니다. panoId/position이 바뀌지 않는 한 인스턴스를
 * 새로 만들지 않으므로, interactive를 false로 바꿔도 사용자가 둘러보던 화면 그대로 멈춥니다.
 */
export function RoadviewLayer({ panoId, position, interactive, onReady }: RoadviewLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const roadview = new window.kakao.maps.Roadview(containerRef.current);
    if (onReady) {
      window.kakao.maps.event.addListener(roadview, 'init', onReady);
    }

    const latlng = new window.kakao.maps.LatLng(position.lat, position.lng);
    roadview.setPanoId(panoId, latlng);

    // panoId가 바뀌면 새 Roadview 인스턴스를 만들어 다시 그립니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panoId]);

  return (
    <div
      ref={containerRef}
      className={`roadview-layer${interactive ? ' roadview-layer--interactive' : ''}`}
    />
  );
}
