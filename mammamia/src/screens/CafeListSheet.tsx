import { type PointerEvent, useEffect, useRef, useState } from "react";
import { Badge, ListRow } from "@toss/tds-mobile";
import type { Cafe } from "../lib/queries/useCafes";
import "./CafeListSheet.css";

const EXPANDED_RATIO = 0.68; // 뷰포트 높이의 68%까지 펼쳐짐
const PEEK_HEIGHT = 250; // 접혔을 때 보이는 높이(px) — 핸들 + 요약 한 줄

type Props = {
  cafes: Cafe[];
  loading: boolean;
  onSelect: (cafe: Cafe) => void;
};

export function CafeListSheet({ cafes, loading, onSelect }: Props) {
  const [sheetHeight, setSheetHeight] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ pointerY: number; translateY: number } | null>(
    null
  );

  useEffect(() => {
    const updateHeight = () => {
      const height = Math.round(window.innerHeight * EXPANDED_RATIO);
      setSheetHeight(height);
      setTranslateY(height - PEEK_HEIGHT); // 처음엔 접힌 상태(리스트 요약만)로 시작
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const peekY = Math.max(sheetHeight - PEEK_HEIGHT, 0);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { pointerY: e.clientY, translateY };
    setDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragStartRef.current) return;
    const delta = e.clientY - dragStartRef.current.pointerY;
    const next = Math.min(
      peekY,
      Math.max(0, dragStartRef.current.translateY + delta)
    );
    setTranslateY(next);
  }

  function handlePointerUp() {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setDragging(false);
    setTranslateY((current) => (current > peekY / 2 ? peekY : 0));
  }

  return (
    <div
      className="cafe-sheet"
      style={{
        height: sheetHeight,
        transform: `translateY(${translateY}px)`,
        transition: dragging ? "none" : "transform 0.25s ease-out",
      }}
    >
      <div
        className="cafe-sheet-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="cafe-sheet-handle-bar" />
        <p className="cafe-sheet-summary">
          {loading ? "주변 카페를 찾는 중..." : `주변 카페 ${cafes.length}곳`}
        </p>
      </div>

      <ul className="cafe-sheet-list">
        {cafes.map((cafe) => (
          <ListRow
            key={cafe.id}
            onClick={() => onSelect(cafe)}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={cafe.name}
                bottom={`${formatDistance(cafe.distanceKm)} · ${cafe.address}`}
              />
            }
            right={
              <div className="cafe-sheet-badges">
                {cafe.hasNursingRoom && (
                  <Badge size="small" variant="weak" color="teal">
                    수유실
                  </Badge>
                )}
                {cafe.hasDiaperTable && (
                  <Badge size="small" variant="weak" color="blue">
                    기저귀교환대
                  </Badge>
                )}
              </div>
            }
          />
        ))}
      </ul>
    </div>
  );
}

function formatDistance(distanceKm: number) {
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)}m`
    : `${distanceKm.toFixed(1)}km`;
}
