import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toast';
import type { ToastApi, ToastKind } from './toast';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURACAO_MS = 4500;
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
    (kind: ToastKind, message: string) => {
      proximoId.current += 1;
      const id = proximoId.current;
      setToasts((lista) => [...lista.slice(-3), { id, kind, message }]);
      timers.current.set(
        id,
        setTimeout(() => fechar(id), DURACAO_MS)
      );
    },
    [fechar]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (mensagem) => mostrar('success', mensagem),
      error: (mensagem) => mostrar('error', mensagem),
      info: (mensagem) => mostrar('info', mensagem),
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
