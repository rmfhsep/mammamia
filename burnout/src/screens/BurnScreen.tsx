import { useEffect, useRef, useState } from 'react';
import { Button, useDialog, useToast } from '@toss/tds-mobile';
import { loadKakaoMaps } from '../lib/kakao';
import { useGameProgress } from '../hooks/useGameProgress';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { WEAPONS } from '../game/weapons';
import { WeaponIcon } from '../game/WeaponIcon';
import { RoadviewLayer } from './burn/RoadviewLayer';
import { EffectCanvas } from './burn/EffectCanvas';
import { ScoutingScreen } from './burn/ScoutingScreen';
import type { FoundTarget } from './AddressScreen';
import './BurnScreen.css';

type ViewMode = 'aiming' | 'playing';

// 'init' 이벤트가 어떤 이유로든 안 오는 경우(도메인 미등록, 네트워크 문제 등) 로딩 화면에
// 영영 갇히지 않도록 하는 안전장치입니다.
const ROADVIEW_READY_TIMEOUT_MS = 8000;

interface BurnScreenProps {
  target: FoundTarget;
  onExit: () => void;
}

export function BurnScreen({ target, onExit }: BurnScreenProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [roadviewReady, setRoadviewReady] = useState(false);
  const [mode, setMode] = useState<ViewMode>('aiming');
  const shakeTargetRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef<number | null>(null);

  const { progress, unlockedWeapons, isMaxLevel, xpRequired, addXp, instantLevelUp, selectWeapon } =
    useGameProgress();
  const { isSupported: adSupported, status: adStatus, request: requestAd } = useRewardedAd();
  const { openToast } = useToast();
  const { openConfirm } = useDialog();

  useEffect(() => {
    loadKakaoMaps().then(() => setSdkReady(true));
  }, []);

  useEffect(() => {
    if (roadviewReady) return;
    const timeout = setTimeout(() => setRoadviewReady(true), ROADVIEW_READY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [roadviewReady]);

  // 레벨이 오르면(탭으로 게이지가 다 찼든, 광고로 즉시 채웠든) 토스트로 알려준다.
  useEffect(() => {
    if (!progress) return;
    if (prevLevelRef.current != null && progress.level > prevLevelRef.current) {
      const unlocked = WEAPONS.find((weapon) => weapon.unlockLevel === progress.level);
      openToast(unlocked ? `레벨업! ${unlocked.name} 획득 🎉` : '레벨업했어요!');
    }
    prevLevelRef.current = progress.level;
    // openToast는 매 렌더 새 함수일 수 있어 level 변화에만 반응하면 충분합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.level]);

  const selectedWeapon = WEAPONS.find((weapon) => weapon.id === progress?.selectedWeaponId) ?? WEAPONS[0];

  function handleHit(damage: number) {
    addXp(damage);
  }

  function handleRequestLevelUp() {
    if (isMaxLevel) return;

    requestAd(
      () => instantLevelUp(),
      async (reason) => {
        if (reason !== 'unsupported') {
          openToast('광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
          return;
        }
        const confirmed = await openConfirm({
          title: '테스트 모드',
          description: '지금 환경에서는 광고를 볼 수 없어요. 광고 없이 바로 레벨업할까요?',
          confirmButton: '레벨업',
          cancelButton: '닫기',
        });
        if (confirmed) instantLevelUp();
      },
    );
  }

  function handleStart() {
    setMode('playing');
  }

  function handleReaim() {
    setMode('aiming');
  }

  if (!progress) return null;

  const xpPercent = isMaxLevel ? 100 : Math.min(100, (progress.levelXp / xpRequired) * 100);

  return (
    <div className="burn-screen">
      <div className="burn-screen__stage" ref={shakeTargetRef}>
        {sdkReady && (
          <RoadviewLayer
            panoId={target.panoId}
            position={target.position}
            interactive={mode === 'aiming'}
            onReady={() => setRoadviewReady(true)}
          />
        )}
        {mode === 'playing' && (
          <EffectCanvas weapon={selectedWeapon} onHit={handleHit} shakeTargetRef={shakeTargetRef} />
        )}
      </div>

      {mode === 'aiming' ? (
        <div className="burn-screen__hud">
          <div className="burn-screen__top">
            <button className="burn-screen__back" onClick={onExit} aria-label="다른 주소로 돌아가기">
              ← 다른 회사
            </button>
            <div className="burn-screen__address">{target.address}</div>
          </div>

          <p className="burn-screen__aim-hint">
            화면을 드래그해서 둘러보고, 불태울 건물이 잘 보이는 각도를 맞춘 뒤 시작해주세요.
          </p>

          <Button color="danger" variant="fill" size="large" display="full" onClick={handleStart}>
            이 각도에서 불지르기 시작 🔥
          </Button>
        </div>
      ) : (
        <div className="burn-screen__hud">
          <div className="burn-screen__top">
            <button className="burn-screen__back" onClick={onExit} aria-label="다른 주소로 돌아가기">
              ← 다른 회사
            </button>
            <div className="burn-screen__address">{target.address}</div>
            <button className="burn-screen__reaim" onClick={handleReaim}>
              🎯 각도 다시
            </button>
            <div className="burn-screen__level">Lv.{progress.level}</div>
          </div>

          {isMaxLevel ? (
            <p className="burn-screen__max-level">🏆 최고 레벨 달성 — 모든 무기를 보유하고 있어요</p>
          ) : (
            <>
              <div className="burn-screen__progress-bar">
                <div className="burn-screen__progress-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <div className="burn-screen__xp-label">
                다음 레벨까지 {Math.max(0, Math.ceil(xpRequired - progress.levelXp))}
              </div>
            </>
          )}

          <div className="burn-screen__weapons">
            {WEAPONS.map((weapon) => {
              const unlocked = unlockedWeapons.some((w) => w.id === weapon.id);
              return (
                <button
                  key={weapon.id}
                  className={
                    'burn-screen__weapon' +
                    (weapon.id === selectedWeapon.id ? ' burn-screen__weapon--active' : '') +
                    (!unlocked ? ' burn-screen__weapon--locked' : '')
                  }
                  disabled={!unlocked}
                  onClick={() => selectWeapon(weapon.id)}
                >
                  <span className="burn-screen__weapon-icon">
                    {unlocked ? <WeaponIcon id={weapon.id} /> : '🔒'}
                  </span>
                  <span className="burn-screen__weapon-name">{weapon.name}</span>
                </button>
              );
            })}
          </div>

          {!isMaxLevel && (
            <Button
              color="light"
              variant="weak"
              size="medium"
              display="full"
              loading={adStatus !== 'idle'}
              onClick={handleRequestLevelUp}
            >
              📺 광고 보고 레벨업 바로 하기{adSupported ? '' : ' (테스트 모드)'}
            </Button>
          )}
        </div>
      )}

      {!roadviewReady && <ScoutingScreen />}
    </div>
  );
}
