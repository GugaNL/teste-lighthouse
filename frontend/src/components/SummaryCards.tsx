import { formatCurrency, formatNumber } from '../utils/format';
import type { ApiError } from '../services/api';
import type { CategorySummary, StockStatusFilter } from '../types/product';

type CampoSomavel = Exclude<keyof CategorySummary, 'name'>;

interface Cartao {
  rotulo: string;
  valor: string;
  extra?: string;
}

interface CartaoDeFiltro {
  faixa: Extract<StockStatusFilter, 'low' | 'out'>;
  rotulo: string;
  campo: CampoSomavel;
  ativo: string;
  alerta: 'atencao' | 'alerta';
}

const CARTOES_DE_FILTRO: readonly CartaoDeFiltro[] = [
  {
    faixa: 'low',
    rotulo: 'Estoque baixo',
    campo: 'lowStock',
    ativo: 'Mostrando só estoque baixo',
    alerta: 'atencao',
  },
  {
    faixa: 'out',
    rotulo: 'Esgotados',
    campo: 'outOfStock',
    ativo: 'Mostrando só esgotados',
    alerta: 'alerta',
  },
];

export interface SummaryCardsProps {
  categories: CategorySummary[] | undefined;
  loading: boolean;
  error: ApiError | null;
  stockStatus: StockStatusFilter | null;
  onToggleStockStatus: (faixa: StockStatusFilter) => void;
}

export default function SummaryCards({
  categories,
  loading,
  error,
  stockStatus,
  onToggleStockStatus,
}: SummaryCardsProps) {
  if (error) {
    return (
      <p className="alerta alerta--aviso" role="status">
        Não foi possível carregar os indicadores: {error.message}
      </p>
    );
  }

  const lista = categories ?? [];
  const soma = (campo: CampoSomavel) => lista.reduce((total, c) => total + c[campo], 0);
  const vazio = loading && !categories;

  const cartoes: Cartao[] = [
    { rotulo: 'Produtos', valor: formatNumber(soma('products')), extra: `${lista.length} categorias` },
    { rotulo: 'Unidades em estoque', valor: formatNumber(soma('stock')) },
    { rotulo: 'Valor em estoque', valor: formatCurrency(Math.round(soma('inventoryValue') * 100) / 100) },
  ];

  return (
    <section className="indicadores" aria-label="Indicadores do catálogo" aria-busy={vazio}>
      {cartoes.map((c) => (
        <div key={c.rotulo} className="indicador">
          <span className="indicador__rotulo">{c.rotulo}</span>
          <strong className="indicador__valor">
            {vazio ? <span className="esqueleto esqueleto--valor" /> : c.valor}
          </strong>
          {c.extra && !vazio ? <span className="indicador__extra">{c.extra}</span> : null}
        </div>
      ))}
      {CARTOES_DE_FILTRO.map((c) => {
        const quantidade = soma(c.campo);
        const ativo = stockStatus === c.faixa;
        const classes = [
          'indicador',
          'indicador--acao',
          quantidade > 0 ? `indicador--${c.alerta}` : '',
          ativo ? `is-ativo is-ativo--${c.alerta}` : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={c.faixa}
            type="button"
            className={classes}
            onClick={() => onToggleStockStatus(c.faixa)}
            aria-pressed={ativo}
            disabled={vazio}
          >
            <span className="indicador__rotulo">{c.rotulo}</span>
            <strong className="indicador__valor">
              {vazio ? <span className="esqueleto esqueleto--valor" /> : formatNumber(quantidade)}
            </strong>
            <span className="indicador__extra">{ativo ? c.ativo : 'Clique para filtrar'}</span>
          </button>
        );
      })}
    </section>
  );
}
