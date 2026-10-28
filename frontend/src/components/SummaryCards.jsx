import { formatCurrency, formatNumber } from '../utils/format';

/**
 * Indicadores do catálogo inteiro (não só da página atual), a partir do
 * resumo por categoria da API.
 */
export default function SummaryCards({ categories, loading, error, onShowOutOfStock, outOfStockActive }) {
  if (error) {
    return (
      <p className="alerta alerta--aviso" role="status">
        Não foi possível carregar os indicadores: {error.message}
      </p>
    );
  }

  const lista = categories ?? [];
  const soma = (campo) => lista.reduce((total, c) => total + c[campo], 0);
  const esgotados = soma('outOfStock');
  const vazio = loading && !categories;

  const cartoes = [
    { rotulo: 'Produtos', valor: formatNumber(soma('products')), extra: `${lista.length} categorias` },
    { rotulo: 'Unidades em estoque', valor: formatNumber(soma('stock')) },
    { rotulo: 'Valor em estoque', valor: formatCurrency(Math.round(soma('inventoryValue') * 100) / 100) },
  ];

  return (
    <section className="indicadores" aria-label="Indicadores do catálogo" aria-busy={vazio}>
      {cartoes.map((c) => (
        <div key={c.rotulo} className="indicador">
          <span className="indicador__rotulo">{c.rotulo}</span>
          <strong className="indicador__valor">{vazio ? <span className="esqueleto esqueleto--valor" /> : c.valor}</strong>
          {c.extra && !vazio ? <span className="indicador__extra">{c.extra}</span> : null}
        </div>
      ))}
      <button
        type="button"
        className={`indicador indicador--acao ${esgotados > 0 ? 'indicador--alerta' : ''} ${outOfStockActive ? 'is-ativo' : ''}`}
        onClick={onShowOutOfStock}
        aria-pressed={outOfStockActive}
        disabled={vazio}
      >
        <span className="indicador__rotulo">Esgotados</span>
        <strong className="indicador__valor">{vazio ? <span className="esqueleto esqueleto--valor" /> : formatNumber(esgotados)}</strong>
        <span className="indicador__extra">{outOfStockActive ? 'Mostrando só esgotados' : 'Clique para filtrar'}</span>
      </button>
    </section>
  );
}
