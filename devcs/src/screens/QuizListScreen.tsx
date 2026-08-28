import { useMemo, useState } from 'react';
import { Badge, ListRow } from '@toss/tds-mobile';
import { CATEGORIES, CATEGORY_META } from '../lib/categoryMeta';
import { getDeviceId } from '../lib/deviceId';
import { useQuestions, type Question, type QuestionCategory } from '../lib/queries/useQuestions';
import { useSolves } from '../lib/queries/useSolves';
import './QuizListScreen.css';

const TOTAL_QUESTIONS = 100;

type Props = {
  onSelectQuestion: (id: string) => void;
};

export function QuizListScreen({ onSelectQuestion }: Props) {
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);

  // 카테고리 카드의 n/전체 집계와 "오늘의 문제" 랜덤 추천을 위해 전체 목록은 항상 받아둔다.
  // category가 null이면 아래 쿼리와 캐시 키가 같아져 중복 요청 없이 재사용된다.
  const allQuery = useQuestions();
  const filteredQuery = useQuestions(category ?? undefined);
  const visibleQuestions = category ? filteredQuery.data : allQuery.data;
  const solvesQuery = useSolves(deviceId);
  const loading = !allQuery.data;

  const solvedIds = useMemo(
    () => new Set((solvesQuery.data ?? []).map((solve) => solve.questionId)),
    [solvesQuery.data],
  );

  const categoryStats = useMemo(() => {
    const stats = new Map<QuestionCategory, { total: number; solved: number }>();
    for (const q of allQuery.data ?? []) {
      const entry = stats.get(q.category) ?? { total: 0, solved: 0 };
      entry.total += 1;
      if (solvedIds.has(q.id)) entry.solved += 1;
      stats.set(q.category, entry);
    }
    return stats;
  }, [allQuery.data, solvedIds]);

  const solvedCount = solvedIds.size;
  const progress = solvedCount / TOTAL_QUESTIONS;

  function pickRandomQuestion(): Question | undefined {
    const pool = allQuery.data ?? [];
    const unsolved = pool.filter((q) => !solvedIds.has(q.id));
    const candidates = unsolved.length > 0 ? unsolved : pool;
    if (candidates.length === 0) return undefined;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function handleRandomPick() {
    const picked = pickRandomQuestion();
    if (picked) onSelectQuestion(picked.id);
  }

  return (
    <div className="quiz-home">
      <header className="quiz-home-header">
        <p className="quiz-home-greeting">오늘도 한 문제, 👋</p>
        <h1 className="quiz-home-title">토스개발자가되</h1>
      </header>

      <section className="quiz-home-hero">
        <ProgressRing progress={progress} />
        <div className="quiz-home-hero-info">
          <p className="quiz-home-hero-count">
            {solvedCount}<span className="quiz-home-hero-total">/{TOTAL_QUESTIONS}</span>
          </p>
          <p className="quiz-home-hero-label">전체 진행률</p>
        </div>
      </section>

      <button type="button" className="quiz-home-cta" onClick={handleRandomPick}>
        <span className="quiz-home-cta-emoji">🎲</span>
        <span className="quiz-home-cta-texts">
          <span className="quiz-home-cta-title">오늘의 문제 풀기</span>
          <span className="quiz-home-cta-subtitle">안 푼 문제 중에서 하나 골라드려요</span>
        </span>
        <span className="quiz-home-cta-arrow">→</span>
      </button>

      <p className="quiz-home-section-title">카테고리</p>
      <ul className="quiz-home-categories">
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const stat = categoryStats.get(c);
          const selected = category === c;
          return (
            <li key={c}>
              <button
                type="button"
                className={`quiz-home-category${selected ? ' selected' : ''}`}
                onClick={() => setCategory((prev) => (prev === c ? null : c))}
              >
                <span className="quiz-home-category-badge" style={{ background: meta.color }}>
                  {meta.emoji}
                </span>
                <span className="quiz-home-category-label">{meta.label}</span>
                <span className="quiz-home-category-count">
                  {stat ? `${stat.solved}/${stat.total}` : '-'}
                </span>
                <span className="quiz-home-category-chevron">›</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="quiz-home-section-title">
        {category ? `${CATEGORY_META[category].label} 문제` : '전체 문제'}
      </p>

      {loading ? (
        <p className="quiz-home-loading">문제를 불러오는 중...</p>
      ) : (
        <ul className="quiz-list">
          {visibleQuestions?.map((question) => (
            <ListRow
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={question.question}
                  bottom={CATEGORY_META[question.category].label}
                />
              }
              right={
                solvedIds.has(question.id) ? (
                  <Badge size="small" variant="weak" color="blue">
                    완료
                  </Badge>
                ) : undefined
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgressRing({ progress, size = 116, stroke = 12 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="quiz-home-ring">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--devcs-ring-track)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--devcs-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}
