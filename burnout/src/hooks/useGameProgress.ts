import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { DEFAULT_PROGRESS, PROGRESS_STORAGE_KEY, type GameProgress } from '../game/progress';
import { MAX_LEVEL, WEAPONS, requiredXpForLevel, weaponsUnlockedAtLevel } from '../game/weapons';

/** 레벨이 다 찰 때까지 xp를 쌓고, 다 차면 레벨업(+다음 레벨 무기 자동 장착)까지 처리합니다. */
function applyXp(progress: GameProgress, amount: number): GameProgress {
  let level = progress.level;
  let xp = progress.levelXp + amount;
  let selectedWeaponId = progress.selectedWeaponId;

  while (level < MAX_LEVEL && xp >= requiredXpForLevel(level)) {
    xp -= requiredXpForLevel(level);
    level += 1;
    const unlocked = WEAPONS.find((weapon) => weapon.unlockLevel === level);
    if (unlocked) selectedWeaponId = unlocked.id;
  }

  if (level >= MAX_LEVEL) xp = 0;

  return { level, levelXp: xp, selectedWeaponId };
}

/** 플레이어 레벨/XP/선택 무기를 기기 로컬 저장소와 동기화하는 훅입니다. */
export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    getJSON<GameProgress>(PROGRESS_STORAGE_KEY).then((saved) => {
      setProgress(saved ?? DEFAULT_PROGRESS);
    });
  }, []);

  useEffect(() => {
    if (progress) setJSON(PROGRESS_STORAGE_KEY, progress);
  }, [progress]);

  /** 타격 등으로 xp를 더한다. 다 차면 자동으로 레벨업한다. */
  const addXp = useCallback((amount: number) => {
    setProgress((prev) => (prev ? applyXp(prev, amount) : prev));
  }, []);

  /** 광고 보상 등으로 현재 레벨의 남은 xp를 즉시 채워 레벨업시킨다. */
  const instantLevelUp = useCallback(() => {
    setProgress((prev) => {
      if (!prev || prev.level >= MAX_LEVEL) return prev;
      const missing = requiredXpForLevel(prev.level) - prev.levelXp;
      return applyXp(prev, missing);
    });
  }, []);

  const selectWeapon = useCallback((weaponId: string) => {
    setProgress((prev) => (prev ? { ...prev, selectedWeaponId: weaponId } : prev));
  }, []);

  const unlockedWeapons = progress ? weaponsUnlockedAtLevel(progress.level) : [];
  const isMaxLevel = progress ? progress.level >= MAX_LEVEL : false;
  const xpRequired = progress ? requiredXpForLevel(progress.level) : 0;

  return { progress, unlockedWeapons, isMaxLevel, xpRequired, addXp, instantLevelUp, selectWeapon };
}
