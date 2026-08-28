import { useMemo, useState } from 'react';
import { Button, FullScreenLoader } from '@toss/tds-mobile';
import { getDeviceId } from '../lib/deviceId';
import { useQuestions } from '../lib/queries/useQuestions';
import { useSolves, useSubmitSolveMutation } from '../lib/queries/useSolves';
import './QuizDetailScreen.css';

type Props = {
  questionId: string;
  onBack: () => void;
};

export function QuizDetailScreen({ questionId, onBack }: Props) {
  const deviceId = useMemo(() => getDeviceId(), []);
  // 카테고리 필터 없이 전체 목록을 다시 조회해, 어떤 필터에서 진입했든 캐시 미스 없이 문제를 찾습니다.
  const questionsQuery = useQuestions();
  const solvesQuery = useSolves(deviceId);
  const submitSolve = useSubmitSolveMutation();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const question = questionsQuery.data?.find((q) => q.id === questionId);
  const previousSolve = solvesQuery.data?.find((s) => s.questionId === questionId);

  if (!question) {
    return <FullScreenLoader label="문제를 불러오는 중..." />;
  }

  // 이번 세션에 막 제출했다면 그 결과를, 이전에 이미 푼 문제라면 그때 기록된 결과를 보여줍니다.
  const result = submitSolve.data ?? previousSolve;
  const pickedIndex = previousSolve ? previousSolve.selectedIndex : selectedIndex;

  function handleSubmit() {
    if (selectedIndex === null) return;
    submitSolve.mutate({ deviceId, questionId, selectedIndex });
  }

  return (
    <div className="quiz-detail-screen">
      <button type="button" className="quiz-detail-back" onClick={onBack}>
        ← 목록으로
      </button>

      <p className="quiz-detail-question">{question.question}</p>

      <ul className="quiz-detail-options">
        {question.options.map((option, index) => {
          const isPicked = pickedIndex === index;
          const isAnswer = !!result && index === result.answerIndex;
          const isWrongPick = !!result && isPicked && !isAnswer;

          return (
            <li key={option}>
              <button
                type="button"
                disabled={!!result}
                className={[
                  'quiz-detail-option',
                  isPicked && !result ? 'selected' : '',
                  isAnswer ? 'correct' : '',
                  isWrongPick ? 'wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelectedIndex(index)}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {!result && (
        <Button
          color="primary"
          variant="fill"
          size="large"
          display="full"
          disabled={selectedIndex === null}
          loading={submitSolve.isPending}
          onClick={handleSubmit}
        >
          제출하기
        </Button>
      )}

      {result && (
        <div className="quiz-detail-result">
          <p className="quiz-detail-result-title">
            {result.isCorrect ? '정답이에요!' : '아쉬워요, 오답이에요'}
          </p>
          <p className="quiz-detail-result-explanation">{result.explanation}</p>
          <Button color="primary" variant="weak" size="large" display="full" onClick={onBack}>
            목록으로
          </Button>
        </div>
      )}
    </div>
  );
}
