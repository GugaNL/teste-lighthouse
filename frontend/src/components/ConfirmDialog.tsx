import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

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

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!open || !dialogo) return undefined;

    const pedirParaFechar = () => {
      if (!busy) onCancel();
    };

    const aoCancelarNativo = (evento: Event) => {
      evento.preventDefault();
      pedirParaFechar();
    };

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        evento.stopPropagation();
        pedirParaFechar();
        return;
      }
      if (evento.key !== 'Tab') return;
      const focaveis = dialogo.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
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

    const aoClicar = (evento: MouseEvent) => {
      if (evento.target === dialogo) pedirParaFechar();
    };

    dialogo.addEventListener('cancel', aoCancelarNativo);
    dialogo.addEventListener('keydown', aoTeclar);
    dialogo.addEventListener('click', aoClicar);
    return () => {
      dialogo.removeEventListener('cancel', aoCancelarNativo);
      dialogo.removeEventListener('keydown', aoTeclar);
      dialogo.removeEventListener('click', aoClicar);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogoRef}
      className="modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
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
