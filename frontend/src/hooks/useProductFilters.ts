import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedCallback } from './useDebouncedCallback';
import type { ProductFilters, ProductSort } from '../types/product';

export const DEFAULT_SORT: ProductSort = '-createdAt';
const ATRASO_DA_BUSCA_MS = 350;

type ParametroDaUrl = 'busca' | 'categoria' | 'ordem' | 'esgotados' | 'pagina';
type MudancasNaUrl = Partial<Record<ParametroDaUrl, string | number | boolean | null>>;

export interface ProductFiltersState {
  search: string;
  searchText: string;
  category: string;
  sort: ProductSort;
  onlyOutOfStock: boolean;
  page: number;
  hasFilters: boolean;
  apiFilters: ProductFilters;
  setSearchText: (texto: string) => void;
  setCategory: (categoria: string) => void;
  setSort: (ordem: ProductSort) => void;
  setOnlyOutOfStock: (ativo: boolean) => void;
  setPage: (pagina: number) => void;
  clearFilters: () => void;
}

/**
 * Busca, filtros, ordenação e página moram na URL (?busca=&categoria=...):
 * recarregar a página, voltar no navegador ou mandar o link para alguém
 * mostra exatamente a mesma lista.
 */
export function useProductFilters(): ProductFiltersState {
  const [params, setParams] = useSearchParams();

  const search = params.get('busca') ?? '';
  const category = params.get('categoria') ?? '';
  const sort = (params.get('ordem') as ProductSort | null) ?? DEFAULT_SORT;
  const onlyOutOfStock = params.get('esgotados') === '1';
  const page = Math.max(1, Number.parseInt(params.get('pagina') ?? '', 10) || 1);

  const atualizarUrl = useCallback(
    (mudancas: MudancasNaUrl) => {
      setParams(
        (atual) => {
          const proximo = new URLSearchParams(atual);
          for (const [chave, valor] of Object.entries(mudancas)) {
            if (valor === '' || valor === null || valor === undefined || valor === false)
              proximo.delete(chave);
            else proximo.set(chave, String(valor));
          }
          // Mudou filtro ou ordem → volta para a primeira página.
          if (!('pagina' in mudancas)) proximo.delete('pagina');
          if (proximo.get('ordem') === DEFAULT_SORT) proximo.delete('ordem');
          if (proximo.get('pagina') === '1') proximo.delete('pagina');
          return proximo;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // A busca digitada só vai para a URL (e para a API) depois de uma pausa.
  const [searchText, setSearchTextLocal] = useState(search);
  const [buscaConhecida, setBuscaConhecida] = useState(search);
  const [ultimaEnviada, setUltimaEnviada] = useState(search);

  // E o caminho inverso: "Limpar filtros" ou o botão voltar mudam a URL.
  if (search !== buscaConhecida) {
    setBuscaConhecida(search);
    if (search !== ultimaEnviada) setSearchTextLocal(search);
  }

  const enviarBusca = useDebouncedCallback((texto: string) => {
    const termo = texto.trim();
    if (termo === search) return;
    setUltimaEnviada(termo);
    atualizarUrl({ busca: termo });
  }, ATRASO_DA_BUSCA_MS);

  const setSearchText = (texto: string) => {
    setSearchTextLocal(texto);
    enviarBusca.run(texto);
  };

  const setPage = useCallback((pagina: number) => atualizarUrl({ pagina }), [atualizarUrl]);

  const clearFilters = () => {
    enviarBusca.cancel();
    setSearchTextLocal('');
    setUltimaEnviada('');
    atualizarUrl({ busca: '', categoria: '', esgotados: '' });
  };

  return {
    search,
    searchText,
    category,
    sort,
    onlyOutOfStock,
    page,
    hasFilters: Boolean(search || category || onlyOutOfStock),
    apiFilters: {
      search,
      category,
      inStock: onlyOutOfStock ? false : undefined,
      sort,
    },
    setSearchText,
    setCategory: (categoria) => atualizarUrl({ categoria }),
    setSort: (ordem) => atualizarUrl({ ordem }),
    setOnlyOutOfStock: (ativo) => atualizarUrl({ esgotados: ativo ? '1' : '' }),
    setPage,
    clearFilters,
  };
}
