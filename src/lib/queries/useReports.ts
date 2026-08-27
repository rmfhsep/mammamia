import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export type CreateReportInput = {
  cafeId: string;
  hasNursingRoom?: boolean;
  hasDiaperTable?: boolean;
  note?: string;
};

export function useCreateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) =>
      apiFetch('/api/reports', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      // 제보가 들어가면 주변 카페 목록의 시설 정보가 바뀔 수 있으니 무효화합니다.
      queryClient.invalidateQueries({ queryKey: ['cafes'] });
    },
  });
}
