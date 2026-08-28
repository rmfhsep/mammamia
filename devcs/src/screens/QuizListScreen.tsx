import { useMemo, useState } from 'react';
import { Badge, FullScreenLoader, ListRow } from '@toss/tds-mobile';
import { getDeviceId } from '../lib/deviceId';
import { useQuestions, type QuestionCategory } from '../lib/queries/useQuestions';
import { useSolves } from '../lib/queries/useSolves';
import './QuizListScreen.css';

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  DATA_STRUCTURE: '자료구조',
  ALGORITHM: '알고리즘',
  NETWORK: '네트워크',
  OPERATING_SYSTEM: '운영체제',
  DATABASE: '데이터베이스',
  WEB: '웹',
  ETC: '기타',
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as QuestionCategory[];

type Props = {
  onSelectQuestion: (id: string) => void;
};

export function QuizListScreen({ onSelectQuestion }: Props) {
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);

  const questionsQuery = useQuestions(category ?? undefined);
  const solvesQuery = useSolves(deviceId);
  const loading = !questionsQuery.data;

  const solvedIds = useMemo(
    () => new Set((solvesQuery.data ?? []).map((solve) => solve.questionId)),
    [solvesQuery.data],
  );

  return (
    <div className="quiz-list-screen">
      <header className="quiz-list-header">
        <h1>토스개발자가되</h1>
        <p>CS 5지선다로 하루 한 문제씩 실력을 쌓아봐요</p>
        {!loading && (
          <p className="quiz-list-progress">
            {solvedIds.size}/{questionsQuery.data?.length ?? 0} 문제 풀이 완료
          </p>
        )}
      </header>

      <div className="quiz-list-filters">
        <button type="button" className={category === null ? 'active' : ''} onClick={() => setCategory(null)}>
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? 'active' : ''}
            onClick={() => setCategory(c)}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {loading && <FullScreenLoader label="문제를 불러오는 중..." />}

      <ul className="quiz-list">
        {questionsQuery.data?.map((question) => (
          <ListRow
            key={question.id}
            onClick={() => onSelectQuestion(question.id)}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={question.question}
                bottom={CATEGORY_LABEL[question.category]}
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
    </div>
  );
}
