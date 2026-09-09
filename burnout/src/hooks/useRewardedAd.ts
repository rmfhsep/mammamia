import { useCallback, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID;

export type RewardedAdStatus = 'idle' | 'loading' | 'showing';
export type RewardedAdFailReason = 'unsupported' | 'loadError' | 'showError' | 'failedToShow';

/**
 * 전면 리워드 광고를 불러오고 노출합니다. 광고를 끝까지 보면 onReward를 호출합니다.
 * adGroupId가 없거나 이 환경에서 광고 API를 지원하지 않으면 onFail('unsupported')를 호출합니다.
 *
 * `npm run dev`(브라우저 로컬 개발)에서는 항상 미지원으로 취급한다 — `@apps-in-toss/devtools`가
 * `vite dev`에서 SDK를 모킹하는데, 그 목(mock)의 `isSupported()`는 무조건 true를 돌려주면서도
 * `showFullScreenAd`는 `clicked` → `dismissed`만 쏘고 `userEarnedReward`는 절대 안 쏜다(모킹 소스
 * 확인함). 그대로 두면 로컬에서 버튼을 눌러도 1.5초쯤 조용히 로딩만 돌다 아무 일도 없이 끝나버려서,
 * `BurnScreen`의 "테스트 모드" 확인 다이얼로그 폴백조차 못 타게 된다. `vite build`(QR 테스트/배포용)는
 * `NODE_ENV=production`이라 모킹이 꺼지므로 실제 브릿지의 `isSupported()`를 그대로 신뢰해도 된다.
 */
export function useRewardedAd() {
  const [status, setStatus] = useState<RewardedAdStatus>('idle');

  const isSupported = !import.meta.env.DEV && Boolean(AD_GROUP_ID) && loadFullScreenAd.isSupported();

  const request = useCallback(
    (onReward: () => void, onFail: (reason: RewardedAdFailReason) => void) => {
      if (!isSupported || !AD_GROUP_ID) {
        onFail('unsupported');
        return;
      }

      setStatus('loading');
      loadFullScreenAd({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type !== 'loaded') return;
          setStatus('showing');
          showFullScreenAd({
            options: { adGroupId: AD_GROUP_ID },
            onEvent: (showEvent) => {
              if (showEvent.type === 'userEarnedReward') {
                setStatus('idle');
                onReward();
              } else if (showEvent.type === 'dismissed') {
                setStatus('idle');
              } else if (showEvent.type === 'failedToShow') {
                setStatus('idle');
                onFail('failedToShow');
              }
            },
            onError: () => {
              setStatus('idle');
              onFail('showError');
            },
          });
        },
        onError: () => {
          setStatus('idle');
          onFail('loadError');
        },
      });
    },
    [isSupported],
  );

  return { isSupported, status, request };
}
