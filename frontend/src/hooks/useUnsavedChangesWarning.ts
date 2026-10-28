import { useEffect } from 'react';

/**
 * Pede confirmação do navegador ao fechar/recarregar a aba com alterações não
 * salvas. A navegação dentro do app (botão Cancelar) tem diálogo próprio.
 */
export function useUnsavedChangesWarning(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return undefined;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [ativo]);
}
