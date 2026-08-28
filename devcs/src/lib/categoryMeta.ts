import type { QuestionCategory } from './queries/useQuestions';

type CategoryMeta = {
  label: string;
  emoji: string;
  color: string;
};

/** 카테고리별 표시 라벨/아이콘/뱃지 색. 홈 화면의 카테고리 카드 색인으로 쓰인다. */
export const CATEGORY_META: Record<QuestionCategory, CategoryMeta> = {
  DATA_STRUCTURE: { label: '자료구조', emoji: '🧱', color: '#7C6FE0' },
  ALGORITHM: { label: '알고리즘', emoji: '⚡️', color: '#3182F6' },
  NETWORK: { label: '네트워크', emoji: '🌐', color: '#12B886' },
  OPERATING_SYSTEM: { label: '운영체제', emoji: '🖥️', color: '#F76707' },
  DATABASE: { label: '데이터베이스', emoji: '🗄️', color: '#E64980' },
  WEB: { label: '웹', emoji: '💻', color: '#FAB005' },
  ETC: { label: '기타', emoji: '🧩', color: '#868E96' },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as QuestionCategory[];
