import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDelayedField } from './useDelayedField';
import type { ProductFilters, ProductSort, StockStatusFilter } from '../types/product';

export const DEFAULT_SORT: ProductSort = '-createdAt';
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

const ESTOQUE_NA_URL: Record<StockStatusFilter, string> = { out: 'esgotado', low: 'baixo', ok: 'ok' };
const ESTOQUE_DA_URL: Record<string, StockStatusFilter> = { esgotado: 'out', baixo: 'low', ok: 'ok' };

type ParametroDaUrl =
  'busca' | 'categoria' | 'ordem' | 'estoque' | 'preco_min' | 'preco_max' | 'pagina' | 'por_pagina';
type MudancasNaUrl = Partial<Record<ParametroDaUrl, string | number | null>>;

export interface ProductFiltersState {
  search: string;
  searchText: string;
  category: string;
  sort: ProductSort;
  stockStatus: StockStatusFilter | null;
  minPrice: number | null;
  maxPrice: number | null;
  minPriceInput: number | null;
  maxPriceInput: number | null;
  priceRangeError: string;
  page: number;
  pageSize: number;
  hasFilters: boolean;
  apiFilters: ProductFilters;
  setSearchText: (texto: string) => void;
  setCategory: (categoria: string) => void;
  setSort: (ordem: ProductSort) => void;
  setStockStatus: (faixa: StockStatusFilter | null) => void;
  setMinPriceInput: (valor: number | null) => void;
  setMaxPriceInput: (valor: number | null) => void;
  setPage: (pagina: number) => void;
  setPageSize: (tamanho: number) => void;
  clearFilters: () => void;
}

const lerPreco = (texto: string | null): number | null => {
  if (texto === null || texto.trim() === '') return null;
  const valor = Number(texto);
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
};

const lerTamanhoDaPagina = (texto: string | null): number => {
  const valor = Number(texto);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(valor) ? valor : DEFAULT_PAGE_SIZE;
};

export function useProductFilters(): ProductFiltersState {
  const [params, setParams] = useSearchParams();

  const search = params.get('busca') ?? '';
  const category = params.get('categoria') ?? '';
  const sort = (params.get('ordem') as ProductSort | null) ?? DEFAULT_SORT;
  const stockStatus = ESTOQUE_DA_URL[params.get('estoque') ?? ''] ?? null;
  const minPrice = lerPreco(params.get('preco_min'));
  const maxPrice = lerPreco(params.get('preco_max'));
  const page = Math.max(1, Number.parseInt(params.get('pagina') ?? '', 10) || 1);
  const pageSize = lerTamanhoDaPagina(params.get('por_pagina'));

  const atualizarUrl = useCallback(
    (mudancas: MudancasNaUrl) => {
      setParams(
        (atual) => {
          const proximo = new URLSearchParams(atual);
          for (const [chave, valor] of Object.entries(mudancas)) {
            if (valor === '' || valor === null || valor === undefined) proximo.delete(chave);
            else proximo.set(chave, String(valor));
          }
          if (!('pagina' in mudancas)) proximo.delete('pagina');
          if (proximo.get('ordem') === DEFAULT_SORT) proximo.delete('ordem');
          if (proximo.get('pagina') === '1') proximo.delete('pagina');
          if (proximo.get('por_pagina') === String(DEFAULT_PAGE_SIZE)) proximo.delete('por_pagina');
          return proximo;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const busca = useDelayedField(
    search,
    (termo) => atualizarUrl({ busca: termo }),
    (texto) => texto.trim()
  );
  const precoMinimo = useDelayedField(minPrice, (valor) => atualizarUrl({ preco_min: valor }));
  const precoMaximo = useDelayedField(maxPrice, (valor) => atualizarUrl({ preco_max: valor }));

  const faixaInvertida = minPrice !== null && maxPrice !== null && maxPrice < minPrice;

  const setPage = useCallback((pagina: number) => atualizarUrl({ pagina }), [atualizarUrl]);

  const clearFilters = () => {
    busca.reset('');
    precoMinimo.reset(null);
    precoMaximo.reset(null);
    atualizarUrl({ busca: '', categoria: '', estoque: '', preco_min: null, preco_max: null });
  };

  return {
    search,
    searchText: busca.value,
    category,
    sort,
    stockStatus,
    minPrice,
    maxPrice,
    minPriceInput: precoMinimo.value,
    maxPriceInput: precoMaximo.value,
    priceRangeError: faixaInvertida ? 'O preço máximo é menor que o mínimo.' : '',
    page,
    pageSize,
    hasFilters: Boolean(search || category || stockStatus || minPrice !== null || maxPrice !== null),
    apiFilters: {
      search,
      category,
      stockStatus: stockStatus ?? undefined,
      minPrice: minPrice ?? undefined,
      maxPrice: faixaInvertida ? undefined : (maxPrice ?? undefined),
      sort,
    },
    setSearchText: busca.setValue,
    setCategory: (categoria) => atualizarUrl({ categoria }),
    setSort: (ordem) => atualizarUrl({ ordem }),
    setStockStatus: (faixa) => atualizarUrl({ estoque: faixa ? ESTOQUE_NA_URL[faixa] : null }),
    setMinPriceInput: precoMinimo.setValue,
    setMaxPriceInput: precoMaximo.setValue,
    setPage,
    setPageSize: (tamanho) => atualizarUrl({ por_pagina: tamanho }),
    clearFilters,
  };
}
