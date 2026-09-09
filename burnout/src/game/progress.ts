export interface GameProgress {
  level: number;
  selectedWeaponId: string;
  /** 현재 레벨에서 다음 레벨까지 쌓인 누적 타격량. requiredXpForLevel(level)에 도달하면 레벨업한다. */
  levelXp: number;
}

export const DEFAULT_PROGRESS: GameProgress = {
  level: 1,
  selectedWeaponId: 'match',
  levelXp: 0,
};

// v1에는 levelXp가 없어 그대로 불러오면 값이 비어 계산이 깨진다 — 키를 올려 기존 저장값은
// 무시하고 새 기본값으로 시작하게 한다.
export const PROGRESS_STORAGE_KEY = 'burnout:progress:v2';
