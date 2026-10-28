import { useEffect } from 'react';

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
