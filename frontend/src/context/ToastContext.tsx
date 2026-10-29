import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toast';
import type { ToastAction, ToastApi, ToastKind, ToastOptions } from './toast';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

const DURACAO_MS = 4500;
const DURACAO_COM_ACAO_MS = 8000;
const CLASSE_POR_TIPO: Record<ToastKind, string> = { success: 'sucesso', error: 'erro', info: 'info' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const fechar = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const pendentes = timers.current;
    return () => {
      pendentes.forEach(clearTimeout);
      pendentes.clear();
    };
  }, []);

  const mostrar = useCallback(
    (kind: ToastKind, message: string, { action }: ToastOptions = {}) => {
      proximoId.current += 1;
      const id = proximoId.current;
      setToasts((lista) => [...lista.slice(-3), { id, kind, message, action }]);
      timers.current.set(
        id,
        setTimeout(() => fechar(id), action ? DURACAO_COM_ACAO_MS : DURACAO_MS)
      );
    },
    [fechar]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (mensagem, opcoes) => mostrar('success', mensagem, opcoes),
      error: (mensagem, opcoes) => mostrar('error', mensagem, opcoes),
      info: (mensagem, opcoes) => mostrar('info', mensagem, opcoes),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast--${CLASSE_POR_TIPO[t.kind]}`}
            role={t.kind === 'error' ? 'alert' : 'status'}
          >
            <span>{t.message}</span>
            {t.action ? (
              <button
                type="button"
                className="toast__acao"
                onClick={() => {
                  fechar(t.id);
                  t.action?.onClick();
                }}
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="toast__fechar"
              onClick={() => fechar(t.id)}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
