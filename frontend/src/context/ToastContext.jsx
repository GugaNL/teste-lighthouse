import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * Avisos rápidos de sucesso/erro ("Produto criado", "Não foi possível excluir").
 *
 * Ficam numa região aria-live: leitores de tela anunciam o resultado da ação
 * sem o foco precisar sair de onde o usuário está.
 */
const ToastContext = createContext(null);

const DURACAO_MS = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(0);

  const fechar = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, mensagem) => {
      proximoId.current += 1;
      const id = proximoId.current;
      setToasts((lista) => [...lista.slice(-3), { id, tipo, mensagem }]);
      setTimeout(() => fechar(id), DURACAO_MS);
    },
    [fechar]
  );

  const api = useMemo(
    () => ({
      success: (mensagem) => mostrar('sucesso', mensagem),
      error: (mensagem) => mostrar('erro', mensagem),
      info: (mensagem) => mostrar('info', mensagem),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`} role={t.tipo === 'erro' ? 'alert' : 'status'}>
            <span>{t.mensagem}</span>
            <button type="button" className="toast__fechar" onClick={() => fechar(t.id)} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return contexto;
}
