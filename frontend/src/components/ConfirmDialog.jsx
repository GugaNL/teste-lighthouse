import { useEffect, useId, useRef } from 'react';

/**
 * Diálogo de confirmação reaproveitável (exclusão, descartar alterações...).
 *
 * Acessível sem biblioteca: role="alertdialog", foco inicial no botão de
 * CANCELAR (o seguro, para Enter acidental não apagar nada), Tab preso dentro
 * do diálogo, Esc fecha e o foco volta para quem abriu.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busyLabel = 'Aguarde…',
  variant = 'perigo',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const tituloId = useId();
  const descricaoId = useId();
  const caixaRef = useRef(null);
  const cancelarRef = useRef(null);
  const focoAnterior = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    focoAnterior.current = document.activeElement;
    cancelarRef.current?.focus();
    return () => focoAnterior.current?.focus?.();
  }, [open]);

  if (!open) return null;

  const aoTeclar = (evento) => {
    if (evento.key === 'Escape' && !busy) {
      evento.stopPropagation();
      onCancel();
      return;
    }
    if (evento.key !== 'Tab') return;
    const focaveis = caixaRef.current.querySelectorAll('button:not([disabled])');
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  return (
    <div
      className="modal"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={caixaRef}
        className="modal__caixa"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricaoId}
        onKeyDown={aoTeclar}
      >
        <h2 id={tituloId} className="modal__titulo">
          {title}
        </h2>
        <div id={descricaoId} className="modal__corpo">
          {children}
        </div>
        {error ? (
          <p className="alerta alerta--erro" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal__acoes">
          <button
            ref={cancelarRef}
            type="button"
            className="botao botao--fantasma"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`botao botao--${variant}`}
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? (
              <>
                <span className="spinner spinner--claro" aria-hidden="true" />
                {busyLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
