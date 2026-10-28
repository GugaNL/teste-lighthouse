import axios from 'axios';

/**
 * Cliente HTTP único da aplicação.
 *
 * Toda chamada passa por aqui, e todo erro sai daqui no mesmo formato
 * (ApiError) — nenhum componente precisa saber se a falha foi rede, timeout
 * ou validação para mostrar uma mensagem útil.
 *
 * Base vazia de propósito: em dev o Vite faz proxy para a 4008 e em produção o
 * próprio backend serve este SPA. VITE_API_URL só existe para o caso de o
 * frontend ser hospedado separado da API.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Erro normalizado de qualquer chamada à API. */
export class ApiError extends Error {
  constructor({ message, status = 0, details = [], currentVersion, canceled = false }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.currentVersion = currentVersion;
    this.canceled = canceled;
  }

  /** { campo: mensagem } — o formato que o formulário consome. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

const MENSAGEM_POR_STATUS = {
  400: 'Dados inválidos. Revise o formulário.',
  404: 'Registro não encontrado.',
  412: 'O registro foi alterado por outra pessoa. Recarregue para ver a versão atual.',
  413: 'Os dados enviados são grandes demais.',
  500: 'O servidor encontrou um erro. Tente novamente em instantes.',
};

/** Traduz qualquer falha do axios para ApiError com mensagem pronta para a tela. */
export function toApiError(erro) {
  if (erro instanceof ApiError) return erro;

  if (axios.isCancel(erro) || erro?.code === 'ERR_CANCELED') {
    return new ApiError({ message: 'Requisição cancelada.', canceled: true });
  }

  if (erro?.response) {
    const { status, data } = erro.response;
    return new ApiError({
      status,
      message:
        data?.message || MENSAGEM_POR_STATUS[status] || `Erro inesperado (HTTP ${status}).`,
      details: Array.isArray(data?.details) ? data.details : [],
      currentVersion: data?.currentVersion,
    });
  }

  if (erro?.code === 'ECONNABORTED') {
    return new ApiError({ message: 'A API demorou demais para responder. Tente novamente.' });
  }

  if (erro?.request) {
    return new ApiError({
      message: 'Não foi possível conectar à API. Verifique sua conexão ou se o servidor está no ar.',
    });
  }

  return new ApiError({ message: erro?.message || 'Erro inesperado.' });
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => Promise.reject(toApiError(erro))
);

export default api;
