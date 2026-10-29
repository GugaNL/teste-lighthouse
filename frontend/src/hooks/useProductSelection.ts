import { useState } from 'react';
import type { Product } from '../types/product';

export interface ProductSelection {
  selected: Product[];
  ids: string[];
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (produto: Product) => void;
  toggleAll: (produtos: Product[]) => void;
  remove: (ids: string[]) => void;
  clear: () => void;
}

export function useProductSelection(): ProductSelection {
  const [selecao, setSelecao] = useState<ReadonlyMap<string, Product>>(new Map());

  const toggle = (produto: Product) =>
    setSelecao((atual) => {
      const proxima = new Map(atual);
      if (proxima.has(produto.id)) proxima.delete(produto.id);
      else proxima.set(produto.id, produto);
      return proxima;
    });

  const toggleAll = (produtos: Product[]) =>
    setSelecao((atual) => {
      const proxima = new Map(atual);
      const todosMarcados = produtos.every((p) => proxima.has(p.id));
      for (const produto of produtos) {
        if (todosMarcados) proxima.delete(produto.id);
        else proxima.set(produto.id, produto);
      }
      return proxima;
    });

  const remove = (ids: string[]) =>
    setSelecao((atual) => {
      if (!ids.some((id) => atual.has(id))) return atual;
      const proxima = new Map(atual);
      ids.forEach((id) => proxima.delete(id));
      return proxima;
    });

  return {
    selected: [...selecao.values()],
    ids: [...selecao.keys()],
    count: selecao.size,
    isSelected: (id) => selecao.has(id),
    toggle,
    toggleAll,
    remove,
    clear: () => setSelecao(new Map()),
  };
}
