import { createContext, useContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastApi {
  success: (mensagem: string) => void;
  error: (mensagem: string) => void;
  info: (mensagem: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return contexto;
}
