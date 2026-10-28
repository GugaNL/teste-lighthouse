import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from '../services/api';

describe('toApiError — todo erro sai no mesmo formato', () => {
  it('usa a mensagem e os detalhes por campo que a API mandou', () => {
    const erro = toApiError({
      response: {
        status: 400,
        data: {
          message: 'Verifique os campos destacados.',
          details: [{ field: 'price', message: 'Preço deve ser maior que zero' }],
        },
      },
    });
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(400);
    expect(erro.message).toBe('Verifique os campos destacados.');
    expect(erro.fieldErrors).toEqual({ price: 'Preço deve ser maior que zero' });
  });

  it('carrega a versão atual no conflito de edição (412)', () => {
    const erro = toApiError({ response: { status: 412, data: { message: 'Mudou.', currentVersion: 4 } } });
    expect(erro.status).toBe(412);
    expect(erro.currentVersion).toBe(4);
  });

  it('tem mensagem padrão por status quando a API não manda corpo', () => {
    expect(toApiError({ response: { status: 500, data: '' } }).message).toMatch(/servidor encontrou um erro/);
  });

  it('explica falha de rede sem jargão', () => {
    expect(toApiError({ request: {}, message: 'Network Error' }).message).toMatch(
      /Não foi possível conectar à API/
    );
  });

  it('identifica timeout', () => {
    expect(toApiError({ code: 'ECONNABORTED', request: {} }).message).toMatch(/demorou demais/);
  });

  it('marca cancelamento para as telas ignorarem', () => {
    expect(toApiError({ code: 'ERR_CANCELED' }).canceled).toBe(true);
  });
});
