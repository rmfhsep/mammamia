import { useEffect, useState } from 'react';

const TIPS = [
  "🪔 무기고에서 성냥을 챙기는 중...",
  "🧯 소방차는 부르지 않을게요, 안심하세요",
  "🔍 정확한 건물 위치를 찾는 중...",
  "🛰️ 로드뷰 위성과 연결하는 중...",
  "🏢 건물 좌표를 확인하는 중...",
];

const FAKE_PROGRESS_CAP = 92;

/** 로드뷰 로딩 동안 보여주는 게임풍 로딩 화면. 실제 진행률은 알 수 없어 점점 느려지는 가짜 진행률을 보여준다. */
export function ScoutingScreen() {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 1800);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) =>
        prev >= FAKE_PROGRESS_CAP ? FAKE_PROGRESS_CAP : prev + (FAKE_PROGRESS_CAP - prev) * 0.12 + 0.4,
      );
    }, 200);
    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="scouting-screen">
      <div className="scouting-screen__flame">🔥</div>
      <h2 className="scouting-screen__title">회사 찾아가는 중...</h2>
      <p className="scouting-screen__tip">{TIPS[tipIndex]}</p>
      <div className="scouting-screen__bar">
        <div className="scouting-screen__bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
