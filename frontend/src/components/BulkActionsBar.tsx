import { plural } from '../utils/format';

export interface BulkActionsBarProps {
  count: number;
  busy: boolean;
  onExport: () => void;
  onChangeCategory: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({
  count,
  busy,
  onExport,
  onChangeCategory,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <section className="lote" aria-label="Ações em lote">
      <p className="lote__contagem" aria-live="polite">
        {plural(count, 'produto selecionado', 'produtos selecionados')}
      </p>
      <div className="lote__acoes">
        <button
          type="button"
          className="botao botao--fantasma botao--pequeno"
          onClick={onExport}
          disabled={busy}
        >
          Exportar selecionados
        </button>
        <button
          type="button"
          className="botao botao--fantasma botao--pequeno"
          onClick={onChangeCategory}
          disabled={busy}
        >
          Mudar categoria
        </button>
        <button
          type="button"
          className="botao botao--perigo-fantasma botao--pequeno"
          onClick={onDelete}
          disabled={busy}
        >
          Excluir selecionados
        </button>
        <button type="button" className="botao botao--link" onClick={onClear} disabled={busy}>
          Limpar seleção
        </button>
      </div>
    </section>
  );
}
