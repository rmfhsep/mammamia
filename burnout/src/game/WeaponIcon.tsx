import type { WeaponId } from './weapons';

interface WeaponIconProps {
  id: WeaponId;
  size?: number;
}

/**
 * 무기 툴바용 초간단 라인아트 아이콘. 이모지 대신 직접 그린다 — 특히 총 계열 이모지는
 * 플랫폼마다 렌더링이 크게 달라(iOS는 권총 이모지를 장난감 물총으로 표시하는 등) 일관성이 없다.
 * 캔버스 위에서 졸라맨이 들고 있는 소품과 같은 실루엣을 쓴다(`EffectEngine.drawWeaponProp`).
 */
export function WeaponIcon({ id, size = 22 }: WeaponIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {renderIcon(id)}
    </svg>
  );
}

function renderIcon(id: WeaponId) {
  switch (id) {
    case 'match':
      return (
        <>
          <line
            x1="7"
            y1="19"
            x2="15"
            y2="8"
            stroke="#BCAAA4"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="15.3" cy="7.3" r="2.8" fill="#FF7043" />
        </>
      );
    case 'molotov':
      return (
        <>
          <rect x="9" y="10" width="6" height="9" rx="2" fill="#8BC34A" />
          <rect x="10.4" y="6" width="3.2" height="5" fill="#8BC34A" />
          <line x1="12" y1="6" x2="12" y2="3" stroke="#BCAAA4" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 3c1 1 1.6 2 .4 3" stroke="#FF7043" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      );
    case 'grenade':
      return (
        <>
          <circle cx="12" cy="14" r="6" fill="#9CCC65" />
          <rect x="10.5" y="4" width="3" height="4" rx="1" fill="#CFD8DC" />
          <line x1="12" y1="8" x2="12" y2="9.5" stroke="#33261F" strokeWidth="1.4" />
        </>
      );
    case 'pistol':
      return (
        <>
          <line x1="4" y1="12" x2="17" y2="12" stroke="#B0BEC5" strokeWidth="4" strokeLinecap="round" />
          <line x1="6.5" y1="12" x2="9" y2="20" stroke="#B0BEC5" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'machinegun':
      return (
        <>
          <line x1="2.5" y1="11" x2="20" y2="11" stroke="#B0BEC5" strokeWidth="3.4" strokeLinecap="round" />
          <line x1="4" y1="12" x2="1.5" y2="17" stroke="#B0BEC5" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="8.5" y1="12" x2="10.5" y2="19" stroke="#B0BEC5" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="14" y1="11.5" x2="14" y2="16.5" stroke="#B0BEC5" strokeWidth="2.8" strokeLinecap="round" />
        </>
      );
    case 'bazooka':
      return (
        <>
          <line x1="5" y1="18" x2="16" y2="8" stroke="#B0BEC5" strokeWidth="6.5" strokeLinecap="round" />
          <line x1="8" y1="15" x2="7" y2="19.5" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="17" cy="7" r="4.4" fill="#B0BEC5" />
          <circle cx="17" cy="7" r="2.2" fill="#263238" />
        </>
      );
  }
}
