import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

const LINHAS_ESQUELETO = 5;

/**
 * Tabela de produtos. No celular as linhas viram cartões só com CSS (cada
 * célula traz o próprio rótulo em data-rotulo) — uma marcação só, sem duas
 * versões da lista para manter em sincronia.
 */
export default function ProductTable({ products, loading, deletingId, highlightId, onDelete, linkState }) {
  const inicial = loading && !products;

  return (
    <div className={`tabela-envoltorio ${loading && products ? 'is-atualizando' : ''}`} aria-busy={loading}>
      <table className="tabela">
        <caption className="sr-only">Produtos do catálogo</caption>
        <thead>
          <tr>
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
          {inicial
            ? Array.from({ length: LINHAS_ESQUELETO }, (_, i) => (
                <tr key={i} className="tabela__esqueleto" aria-hidden="true">
                  {Array.from({ length: 6 }, (__, j) => (
                    <td key={j}>
                      <span className="esqueleto" />
                    </td>
                  ))}
                </tr>
              ))
            : products.map((p) => (
                <tr key={p.id} className={p.id === highlightId ? 'is-destaque' : undefined}>
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
              ))}
        </tbody>
      </table>
    </div>
  );
}
