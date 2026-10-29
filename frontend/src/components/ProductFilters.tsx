import type { Ref } from 'react';
import MoneyInput from './MoneyInput';
import type { CategorySummary, ProductSort, StockStatusFilter } from '../types/product';

export interface SortOption {
  value: ProductSort;
  label: string;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { value: '-createdAt', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A–Z)' },
  { value: '-name', label: 'Nome (Z–A)' },
  { value: 'price', label: 'Menor preço' },
  { value: '-price', label: 'Maior preço' },
  { value: 'stock', label: 'Menor estoque' },
  { value: '-stock', label: 'Maior estoque' },
  { value: '-updatedAt', label: 'Atualizados recentemente' },
];

const STOCK_OPTIONS: readonly { value: StockStatusFilter; label: string }[] = [
  { value: 'ok', label: 'Em estoque' },
  { value: 'low', label: 'Estoque baixo' },
  { value: 'out', label: 'Esgotado' },
];

const ehOrdem = (valor: string): valor is ProductSort => SORT_OPTIONS.some((o) => o.value === valor);
const ehFaixa = (valor: string): valor is StockStatusFilter => STOCK_OPTIONS.some((o) => o.value === valor);

export interface ProductFiltersProps {
  search: string;
  onSearchChange: (texto: string) => void;
  searchInputRef?: Ref<HTMLInputElement>;
  category: string;
  onCategoryChange: (categoria: string) => void;
  categories?: CategorySummary[];
  sort: ProductSort;
  onSortChange: (ordem: ProductSort) => void;
  stockStatus: StockStatusFilter | null;
  onStockStatusChange: (faixa: StockStatusFilter | null) => void;
  minPrice: number | null;
  onMinPriceChange: (valor: number | null) => void;
  maxPrice: number | null;
  onMaxPriceChange: (valor: number | null) => void;
  priceRangeError?: string;
  hasFilters: boolean;
  onClear: () => void;
}

export default function ProductFilters({
  search,
  onSearchChange,
  searchInputRef,
  category,
  onCategoryChange,
  categories = [],
  sort,
  onSortChange,
  stockStatus,
  onStockStatusChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  priceRangeError,
  hasFilters,
  onClear,
}: ProductFiltersProps) {
  return (
    <div className="filtros" role="search">
      <div className="filtros__linha">
        <div className="filtros__busca">
          <label htmlFor="filtro-busca" className="sr-only">
            Buscar produtos
          </label>
          <input
            id="filtro-busca"
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, descrição ou categoria…"
            autoComplete="off"
            aria-keyshortcuts="/"
          />
        </div>

        <div className="filtros__grupo">
          <label htmlFor="filtro-categoria" className="sr-only">
            Categoria
          </label>
          <select id="filtro-categoria" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.products})
              </option>
            ))}
          </select>

          <label htmlFor="filtro-ordem" className="sr-only">
            Ordenar por
          </label>
          <select
            id="filtro-ordem"
            value={sort}
            onChange={(e) => {
              if (ehOrdem(e.target.value)) onSortChange(e.target.value);
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filtros__linha">
        <div className="filtros__grupo">
          <label htmlFor="filtro-estoque" className="sr-only">
            Estoque
          </label>
          <select
            id="filtro-estoque"
            value={stockStatus ?? ''}
            onChange={(e) => onStockStatusChange(ehFaixa(e.target.value) ? e.target.value : null)}
          >
            <option value="">Qualquer estoque</option>
            {STOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <fieldset className="filtros__preco">
            <legend className="sr-only">Faixa de preço</legend>
            <label htmlFor="filtro-preco-min" className="sr-only">
              Preço mínimo
            </label>
            <MoneyInput
              id="filtro-preco-min"
              value={minPrice}
              onChange={onMinPriceChange}
              placeholder="Preço mín."
              aria-invalid={priceRangeError ? true : undefined}
            />
            <span aria-hidden="true">–</span>
            <label htmlFor="filtro-preco-max" className="sr-only">
              Preço máximo
            </label>
            <MoneyInput
              id="filtro-preco-max"
              value={maxPrice}
              onChange={onMaxPriceChange}
              placeholder="Preço máx."
              aria-invalid={priceRangeError ? true : undefined}
              aria-describedby={priceRangeError ? 'filtro-preco-erro' : undefined}
            />
          </fieldset>

          {hasFilters ? (
            <button type="button" className="botao botao--link" onClick={onClear}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>

      {priceRangeError ? (
        <p id="filtro-preco-erro" className="filtros__erro" role="alert">
          {priceRangeError}
        </p>
      ) : null}
    </div>
  );
}
