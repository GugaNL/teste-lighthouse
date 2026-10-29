import { useEffect } from 'react';

const NOME_DO_APP = 'Catálogo de Produtos';

export function useDocumentTitle(titulo: string): void {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_DO_APP}` : NOME_DO_APP;
  }, [titulo]);
}
