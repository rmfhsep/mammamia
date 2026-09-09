export type WeaponId = 'match' | 'molotov' | 'grenade' | 'pistol' | 'machinegun' | 'bazooka';

export interface Weapon {
  id: WeaponId;
  name: string;
  unlockLevel: number;
  damage: number;
  cooldownMs: number;
  description: string;
}

export const WEAPONS: Weapon[] = [
  {
    id: 'match',
    name: '성냥',
    unlockLevel: 1,
    damage: 4,
    cooldownMs: 260,
    description: '기본 아이템. 작은 불씨를 남겨요.',
  },
  {
    id: 'molotov',
    name: '화염병',
    unlockLevel: 2,
    damage: 10,
    cooldownMs: 480,
    description: '넓게 불이 번지는 화염병.',
  },
  {
    id: 'grenade',
    name: '수류탄',
    unlockLevel: 3,
    damage: 22,
    cooldownMs: 750,
    description: '큰 폭발과 진동을 일으켜요.',
  },
  {
    id: 'pistol',
    name: '권총',
    unlockLevel: 4,
    damage: 16,
    cooldownMs: 320,
    description: '빠르고 정확한 한 발.',
  },
  {
    id: 'machinegun',
    name: '기관총',
    unlockLevel: 5,
    damage: 12,
    cooldownMs: 150,
    description: '연사 속도가 가장 빠른 무기.',
  },
  {
    id: 'bazooka',
    name: '바주카',
    unlockLevel: 6,
    damage: 55,
    cooldownMs: 1300,
    description: '건물을 통째로 뒤흔드는 최종 병기.',
  },
];

export const MAX_LEVEL = WEAPONS.length;

export function weaponsUnlockedAtLevel(level: number): Weapon[] {
  return WEAPONS.filter((weapon) => weapon.unlockLevel <= level);
}

/** 현재 레벨에서 다음 레벨로 올라가는 데 필요한 누적 타격량. 레벨이 오를수록 점점 더 많이 필요해진다. */
export function requiredXpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.9, level - 1));
}
