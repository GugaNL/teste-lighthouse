import { useEffect } from 'react';

/**
 * Pede confirmação do navegador ao fechar/recarregar a aba com alterações não
 * salvas. A navegação dentro do app (botão Cancelar) tem diálogo próprio.
 */
export function useUnsavedChangesWarning(ativo) {
  useEffect(() => {
    if (!ativo) return undefined;
    const avisar = (evento) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [ativo]);
}
