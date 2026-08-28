import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { queryKeys } from './keys';

export type Solve = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
  solvedAt: string;
};

export function useSolves(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.solves(deviceId),
    queryFn: () =>
      apiFetch<{ solves: Solve[] }>(`/api/solves?deviceId=${deviceId}`).then((res) => res.solves),
  });
}

export type SubmitSolveInput = {
  deviceId: string;
  questionId: string;
  selectedIndex: number;
};

export type SubmitSolveResult = {
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
};

export function useSubmitSolveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitSolveInput) =>
      apiFetch<SubmitSolveResult>('/api/solves', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (_result, variables) => {
      // 풀이 결과가 저장되면 목록/상세 화면에서 참조하는 solves 캐시를 갱신합니다.
      queryClient.invalidateQueries({ queryKey: queryKeys.solves(variables.deviceId) });
    },
  });
}
