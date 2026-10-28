import type { CategorySummary, ProductSort } from '../types/product';

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

const ehOrdem = (valor: string): valor is ProductSort => SORT_OPTIONS.some((o) => o.value === valor);

export interface ProductFiltersProps {
  search: string;
  onSearchChange: (texto: string) => void;
  category: string;
  onCategoryChange: (categoria: string) => void;
  categories?: CategorySummary[];
  sort: ProductSort;
  onSortChange: (ordem: ProductSort) => void;
  onlyOutOfStock: boolean;
  onOnlyOutOfStockChange: (ativo: boolean) => void;
  hasFilters: boolean;
  onClear: () => void;
}

/** Barra de busca, filtros e ordenação da listagem (controlada pela página). */
export default function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories = [],
  sort,
  onSortChange,
  onlyOutOfStock,
  onOnlyOutOfStockChange,
  hasFilters,
  onClear,
}: ProductFiltersProps) {
  return (
    <div className="filtros" role="search">
      <div className="filtros__busca">
        <label htmlFor="filtro-busca" className="sr-only">
          Buscar produtos
        </label>
        <input
          id="filtro-busca"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, descrição ou categoria…"
          autoComplete="off"
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

        <label className="filtros__check">
          <input
            type="checkbox"
            checked={onlyOutOfStock}
            onChange={(e) => onOnlyOutOfStockChange(e.target.checked)}
          />
          Só esgotados
        </label>

        {hasFilters ? (
          <button type="button" className="botao botao--link" onClick={onClear}>
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
