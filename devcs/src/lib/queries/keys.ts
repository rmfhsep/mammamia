export const queryKeys = {
  questions: (category?: string) => ['questions', category ?? 'all'] as const,
  solves: (deviceId: string) => ['solves', deviceId] as const,
};
