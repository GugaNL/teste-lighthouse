import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorInit {
  message: string;
  status?: number;
  details?: ApiFieldError[];
  currentVersion?: number;
  canceled?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiFieldError[];
  readonly currentVersion: number | undefined;
  readonly canceled: boolean;

  constructor({ message, status = 0, details = [], currentVersion, canceled = false }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.currentVersion = currentVersion;
    this.canceled = canceled;
  }

  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

const MENSAGEM_POR_STATUS: Record<number, string> = {
  400: 'Dados inválidos. Revise o formulário.',
  404: 'Registro não encontrado.',
  412: 'O registro foi alterado por outra pessoa. Recarregue para ver a versão atual.',
  413: 'Os dados enviados são grandes demais.',
  500: 'O servidor encontrou um erro. Tente novamente em instantes.',
};

interface FalhaHttp {
  code?: string;
  message?: string;
  request?: unknown;
  response?: { status: number; data?: unknown };
}

interface CorpoDeErro {
  message?: unknown;
  details?: unknown;
  currentVersion?: unknown;
}

const comoObjeto = <T extends object>(valor: unknown): Partial<T> =>
  valor && typeof valor === 'object' ? valor : {};

const ehDetalheDeCampo = (valor: unknown): valor is ApiFieldError => {
  const { field, message } = comoObjeto<ApiFieldError>(valor);
  return typeof field === 'string' && typeof message === 'string';
};

export function toApiError(erro: unknown): ApiError {
  if (erro instanceof ApiError) return erro;
  const falha = comoObjeto<FalhaHttp>(erro);

  if (axios.isCancel(erro) || falha.code === 'ERR_CANCELED') {
    return new ApiError({ message: 'Requisição cancelada.', canceled: true });
  }

  if (falha.response) {
    const { status, data } = falha.response;
    const corpo = comoObjeto<CorpoDeErro>(data);
    return new ApiError({
      status,
      message:
        (typeof corpo.message === 'string' && corpo.message) ||
        MENSAGEM_POR_STATUS[status] ||
        `Erro inesperado (HTTP ${status}).`,
      details: Array.isArray(corpo.details) ? corpo.details.filter(ehDetalheDeCampo) : [],
      currentVersion: typeof corpo.currentVersion === 'number' ? corpo.currentVersion : undefined,
    });
  }

  if (falha.code === 'ECONNABORTED') {
    return new ApiError({ message: 'A API demorou demais para responder. Tente novamente.' });
  }

  if (falha.request) {
    return new ApiError({
      message: 'Não foi possível conectar à API. Verifique sua conexão ou se o servidor está no ar.',
    });
  }

  return new ApiError({ message: falha.message || 'Erro inesperado.' });
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => Promise.reject(toApiError(erro))
);

export default api;
