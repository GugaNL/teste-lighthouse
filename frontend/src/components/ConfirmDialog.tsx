import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, SyntheticEvent } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  variant?: 'perigo' | 'primario';
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

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
}: ConfirmDialogProps) {
  const tituloId = useId();
  const descricaoId = useId();
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!open || !dialogo) return undefined;
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogo.open) dialogo.showModal();
    cancelarRef.current?.focus();
    return () => {
      if (dialogo.open) dialogo.close();
      focoAnterior?.focus();
    };
  }, [open]);

  if (!open) return null;

  const pedirParaFechar = () => {
    if (!busy) onCancel();
  };

  const aoCancelarNativo = (evento: SyntheticEvent<HTMLDialogElement>) => {
    evento.preventDefault();
    pedirParaFechar();
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLDialogElement>) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.stopPropagation();
      pedirParaFechar();
      return;
    }
    if (evento.key !== 'Tab' || !dialogoRef.current) return;
    const focaveis = dialogoRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (!primeiro || !ultimo) return;
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  const aoClicar = (evento: MouseEvent<HTMLDialogElement>) => {
    if (evento.target === evento.currentTarget) pedirParaFechar();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogoRef}
      className="modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onCancel={aoCancelarNativo}
      onKeyDown={aoTeclar}
      onClick={aoClicar}
    >
      <div className="modal__caixa">
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
    </dialog>
  );
}
