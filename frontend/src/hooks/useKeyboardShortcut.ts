import { useEffect, useRef } from 'react';

const ehCampoEditavel = (alvo: EventTarget | null): boolean =>
  alvo instanceof HTMLElement &&
  (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName));

export function useKeyboardShortcut(tecla: string, acao: () => void, ativo = true): void {
  const acaoRef = useRef(acao);

  useEffect(() => {
    acaoRef.current = acao;
  });

  useEffect(() => {
    if (!ativo) return undefined;
    const ouvir = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() !== tecla.toLowerCase()) return;
      if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.defaultPrevented) return;
      if (ehCampoEditavel(evento.target) || document.querySelector('dialog[open]')) return;
      evento.preventDefault();
      acaoRef.current();
    };
    document.addEventListener('keydown', ouvir);
    return () => document.removeEventListener('keydown', ouvir);
  }, [tecla, ativo]);
}
