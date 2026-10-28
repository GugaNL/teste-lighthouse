import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from '../services/api';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}

const ehPassageiro = (erro: ApiError) => erro.status === 0 || erro.status >= 500;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (falhas, erro) => falhas < 1 && ehPassageiro(erro),
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });
}
