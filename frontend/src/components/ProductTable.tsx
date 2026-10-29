import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { formatCurrency, formatDateTime } from '../utils/format';
import type { Product } from '../types/product';
import type { ProductRouteState } from '../types/navigation';

const LINHAS_ESQUELETO = 5;
const COLUNAS = 7;

export interface ProductTableProps {
  products: Product[] | undefined;
  loading: boolean;
  deletingId?: string | null;
  highlightId?: string;
  onDelete: (produto: Product) => void;
  linkState: ProductRouteState;
  isSelected: (id: string) => boolean;
  onToggleSelected: (produto: Product) => void;
  onToggleAll: (produtos: Product[]) => void;
}

function SelecionarPagina({
  products,
  isSelected,
  onToggleAll,
}: {
  products: Product[];
  isSelected: (id: string) => boolean;
  onToggleAll: (produtos: Product[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const marcados = products.filter((p) => isSelected(p.id)).length;
  const todos = products.length > 0 && marcados === products.length;
  const alguns = marcados > 0 && !todos;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = alguns;
  }, [alguns]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={todos}
      onChange={() => onToggleAll(products)}
      disabled={products.length === 0}
      aria-label="Selecionar todos desta página"
    />
  );
}

export default function ProductTable({
  products,
  loading,
  deletingId,
  highlightId,
  onDelete,
  linkState,
  isSelected,
  onToggleSelected,
  onToggleAll,
}: ProductTableProps) {
  return (
    <div className={`tabela-envoltorio ${loading && products ? 'is-atualizando' : ''}`} aria-busy={loading}>
      <table className="tabela">
        <caption className="sr-only">Produtos do catálogo</caption>
        <thead>
          <tr>
            <th scope="col" className="tabela__selecao">
              <SelecionarPagina products={products ?? []} isSelected={isSelected} onToggleAll={onToggleAll} />
            </th>
            <th scope="col">Produto</th>
            <th scope="col">Categoria</th>
            <th scope="col" className="tabela__num">
              Preço
            </th>
            <th scope="col">Estoque</th>
            <th scope="col">Atualizado</th>
            <th scope="col" className="tabela__acoes">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {!products
            ? Array.from({ length: LINHAS_ESQUELETO }, (_, i) => (
                <tr key={i} className="tabela__esqueleto" aria-hidden="true">
                  {Array.from({ length: COLUNAS }, (__, j) => (
                    <td key={j}>
                      <span className="esqueleto" />
                    </td>
                  ))}
                </tr>
              ))
            : products.map((p) => {
                const selecionado = isSelected(p.id);
                const classes = [
                  p.id === highlightId ? 'is-destaque' : '',
                  selecionado ? 'is-selecionado' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <tr key={p.id} className={classes || undefined}>
                    <td className="tabela__selecao">
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => onToggleSelected(p)}
                        aria-label={`Selecionar ${p.name}`}
                      />
                    </td>
                    <td data-rotulo="Produto" className="tabela__produto">
                      <strong>{p.name}</strong>
                      {p.description ? <span className="tabela__descricao">{p.description}</span> : null}
                    </td>
                    <td data-rotulo="Categoria">
                      <span className="etiqueta">{p.category}</span>
                    </td>
                    <td data-rotulo="Preço" className="tabela__num">
                      {formatCurrency(p.price)}
                    </td>
                    <td data-rotulo="Estoque">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td data-rotulo="Atualizado" className="tabela__data">
                      {formatDateTime(p.updatedAt)}
                    </td>
                    <td className="tabela__acoes">
                      <Link
                        to={`/produtos/${p.id}/editar`}
                        state={linkState}
                        className="botao botao--fantasma botao--pequeno"
                        aria-label={`Editar ${p.name}`}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="botao botao--perigo-fantasma botao--pequeno"
                        onClick={() => onDelete(p)}
                        disabled={deletingId === p.id}
                        aria-label={`Excluir ${p.name}`}
                      >
                        {deletingId === p.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
