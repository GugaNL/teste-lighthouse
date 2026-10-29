import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ToastContext } from './toast';
import type { ToastAction, ToastApi, ToastKind, ToastOptions } from './toast';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  duration: number;
}

interface Temporizador {
  timeout: ReturnType<typeof setTimeout>;
  inicio: number;
  restante: number;
}

const DURACAO_MS = 5000;
const DURACAO_COM_ACAO_MS = 8000;
const CLASSE_POR_TIPO: Record<ToastKind, string> = { success: 'sucesso', error: 'erro', info: 'info' };

function IconeDoToast({ kind }: { kind: ToastKind }) {
  return (
    <span className="toast__icone" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
        {kind === 'success' ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {kind === 'error' ? <path d="M12 7v6M12 17h.01" strokeLinecap="round" /> : null}
        {kind === 'info' ? <path d="M12 11v6M12 7h.01" strokeLinecap="round" /> : null}
      </svg>
    </span>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);
  const timers = useRef(new Map<number, Temporizador>());

  const fechar = useCallback((id: number) => {
    clearTimeout(timers.current.get(id)?.timeout);
    timers.current.delete(id);
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  const agendar = useCallback(
    (id: number, restante: number) => {
      timers.current.set(id, {
        timeout: setTimeout(() => fechar(id), restante),
        inicio: Date.now(),
        restante,
      });
    },
    [fechar]
  );

  const pausar = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (!timer) return;
    clearTimeout(timer.timeout);
    timers.current.set(id, { ...timer, restante: Math.max(0, timer.restante - (Date.now() - timer.inicio)) });
  }, []);

  const retomar = useCallback(
    (id: number) => {
      const timer = timers.current.get(id);
      if (timer) agendar(id, timer.restante);
    },
    [agendar]
  );

  useEffect(() => {
    const pendentes = timers.current;
    return () => {
      pendentes.forEach((timer) => clearTimeout(timer.timeout));
      pendentes.clear();
    };
  }, []);

  const mostrar = useCallback(
    (kind: ToastKind, message: string, { action }: ToastOptions = {}) => {
      proximoId.current += 1;
      const id = proximoId.current;
      const duration = action ? DURACAO_COM_ACAO_MS : DURACAO_MS;
      setToasts((lista) => [...lista.slice(-3), { id, kind, message, action, duration }]);
      agendar(id, duration);
    },
    [agendar]
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
            style={{ '--duracao': `${t.duration}ms` } as CSSProperties}
            onMouseEnter={() => pausar(t.id)}
            onMouseLeave={() => retomar(t.id)}
            onFocus={() => pausar(t.id)}
            onBlur={() => retomar(t.id)}
          >
            <IconeDoToast kind={t.kind} />
            <p className="toast__mensagem">{t.message}</p>
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
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
            <span className="toast__tempo" aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
