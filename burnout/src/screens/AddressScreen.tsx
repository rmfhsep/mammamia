import { useEffect, useState } from 'react';
import { Button, TextField, useToast } from '@toss/tds-mobile';
import { findNearestPanoId, geocodeAddress, loadKakaoMaps, type LatLngLiteral } from '../lib/kakao';
import './AddressScreen.css';

export interface FoundTarget {
  address: string;
  position: LatLngLiteral;
  panoId: number;
}

interface AddressScreenProps {
  onFound: (target: FoundTarget) => void;
}

export function AddressScreen({ onFound }: AddressScreenProps) {
  const [address, setAddress] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const { openToast } = useToast();

  useEffect(() => {
    loadKakaoMaps()
      .then(() => setSdkReady(true))
      .catch(() => openToast('카카오맵을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'));
    // openToast는 매 렌더 새 함수일 수 있어 최초 1회만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    const trimmed = address.trim();
    if (!trimmed || !sdkReady || searching) return;

    setSearching(true);
    try {
      const position = await geocodeAddress(trimmed);
      if (!position) {
        openToast('주소를 찾지 못했어요. 지번 또는 도로명 주소로 다시 입력해보세요.');
        return;
      }

      const panoId = await findNearestPanoId(position);
      if (panoId == null) {
        openToast('이 주소 근처에는 로드뷰가 없어요. 다른 주소를 입력해보세요.');
        return;
      }

      onFound({ address: trimmed, position, panoId });
    } catch {
      openToast('검색 중 문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="address-screen">
      <div className="address-screen__hero">
        <span className="address-screen__emoji">🔥</span>
        <h1>회사 불지르기</h1>
        <p>다니는 회사 주소를 입력하면, 그 건물을 실사 로드뷰로 불태울 수 있어요.</p>
      </div>

      <div className="address-screen__form">
        <TextField
          variant="box"
          label="회사 주소"
          placeholder="예: 서울 강남구 테헤란로 131"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSearch();
          }}
        />
        <Button
          color="danger"
          variant="fill"
          size="large"
          display="full"
          loading={searching}
          disabled={!sdkReady}
          onClick={handleSearch}
        >
          건물 찾아서 불지르기
        </Button>
      </div>

      <p className="address-screen__disclaimer">
        ⚠️ 스트레스 해소용 가상 시뮬레이션이에요. 실제 방화는 절대 안 돼요.
      </p>
    </div>
  );
}
