import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';

type Props = {
  adGroupId: string;
};

/** 앱인토스 배너 광고 부착. 토스 앱 5.241.0 미만 등 SDK 미지원 환경에서는 아무것도 렌더링하지 않는다. */
export function BannerAd({ adGroupId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSupported] = useState(() => TossAds.initialize.isSupported());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => {
          console.error('TossAds 초기화 실패', error);
        },
      },
    });
  }, [isSupported]);

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;

    const attached = TossAds.attachBanner(adGroupId, containerRef.current, {
      variant: 'card',
      callbacks: {
        onAdFailedToRender: (payload) => {
          console.error('배너 광고 렌더링 실패', payload.error.message);
        },
      },
    });

    return () => {
      attached?.destroy();
    };
  }, [isInitialized, adGroupId]);

  if (!isSupported) return null;

  return <div ref={containerRef} style={{ width: '100%' }} />;
}
