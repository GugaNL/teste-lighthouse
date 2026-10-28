/**
 * Regras do produto no frontend — espelho de backend/src/app/rules/product.js
 * e do Joi da API.
 *
 * A API continua sendo a autoridade (ela valida de novo e responde 400); estas
 * regras existem para o usuário ver o erro ao sair do campo, sem esperar a ida
 * ao servidor. Se uma regra mudar lá, muda aqui — os testes dos dois lados
 * usam os mesmos casos-limite e as mesmas mensagens.
 */
import type { Product } from '../types/product';
import type { ProductFormValues } from '../schemas/productSchema';

export const LIMITS = Object.freeze({
  name: { min: 3, max: 120 },
  description: { max: 1000 },
  category: { max: 60 },
  price: { max: 999_999_999.99 },
  stock: { max: 999_999_999 },
});

export const LOW_STOCK_THRESHOLD = 5;

export const normalizeText = (texto: string): string => texto.trim().replace(/\s+/g, ' ');

/** Produto da API → valores iniciais do formulário (vazio quando é criação). */
export function toFormValues(produto?: Product): ProductFormValues {
  return {
    name: produto?.name ?? '',
    description: produto?.description ?? '',
    price: produto?.price ?? null,
    stock: produto ? String(produto.stock) : '',
    category: produto?.category ?? '',
  };
}

export type StockStatusKey = 'esgotado' | 'baixo' | 'ok';

export interface StockStatus {
  key: StockStatusKey;
  label: string;
}

/** Situação do estoque para o selo da listagem. */
export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return { key: 'esgotado', label: 'Esgotado' };
  if (stock <= LOW_STOCK_THRESHOLD) return { key: 'baixo', label: 'Estoque baixo' };
  return { key: 'ok', label: 'Em estoque' };
}
