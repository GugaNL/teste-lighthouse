import { useId } from 'react';
import { formatNumber } from '../utils/format';

type ItemDaPaginacao = number | '…';

function paginasVisiveis(atual: number, total: number): ItemDaPaginacao[] {
  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return ordenadas.flatMap((p, i): ItemDaPaginacao[] => {
    const anterior = ordenadas[i - 1];
    return anterior !== undefined && p - anterior > 1 ? ['…', p] : [p];
  });
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (pagina: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (tamanho: number) => void;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const tamanhoId = useId();
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, total);

  return (
    <nav className="paginacao" aria-label="Paginação">
      <div className="paginacao__info">
        <span className="paginacao__resumo">
          {formatNumber(inicio)}–{formatNumber(fim)} de {formatNumber(total)}
        </span>
        {pageSizeOptions && onPageSizeChange ? (
          <span className="paginacao__tamanho">
            <label htmlFor={tamanhoId}>Por página</label>
            <select
              id={tamanhoId}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </span>
        ) : null}
      </div>
      {totalPaginas > 1 ? (
        <div className="paginacao__botoes">
          <button
            type="button"
            className="botao botao--fantasma botao--pequeno"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {paginasVisiveis(page, totalPaginas).map((p, i) =>
            p === '…' ? (
              <span key={`reticencias-${i}`} className="paginacao__reticencias" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`botao botao--pequeno ${p === page ? 'botao--primario' : 'botao--fantasma'}`}
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="botao botao--fantasma botao--pequeno"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPaginas}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      ) : null}
    </nav>
  );
}
