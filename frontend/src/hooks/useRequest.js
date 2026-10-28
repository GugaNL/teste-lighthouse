import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Estado de uma leitura assíncrona: dados, carregando e erro.
 *
 * Todas as telas que buscam dados usam este hook, então o comportamento é o
 * mesmo em todas:
 * - a requisição anterior é cancelada quando os parâmetros mudam (digitar na
 *   busca não deixa uma resposta velha sobrescrever a nova);
 * - ao recarregar, os dados anteriores continuam na tela enquanto os novos
 *   chegam (`loading` + `data`), em vez de piscar um esqueleto vazio;
 * - erro de cancelamento é ignorado — não é falha, é o usuário seguindo em frente.
 *
 * @param {(signal: AbortSignal) => Promise<any>} request
 * @param {any[]} deps quando mudam, a busca é refeita
 */
export function useRequest(request, deps) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const [tentativa, setTentativa] = useState(0);

  // A função muda a cada render; quem decide quando buscar de novo são as deps.
  const requestRef = useRef(request);
  requestRef.current = request;

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    async function carregar() {
      setState((anterior) => ({ ...anterior, loading: true, error: null }));
      try {
        const data = await requestRef.current(controller.signal);
        if (ativo) setState({ data, loading: false, error: null });
      } catch (error) {
        if (!ativo || error?.canceled) return;
        setState((anterior) => ({ ...anterior, loading: false, error }));
      }
    }

    carregar();
    return () => {
      ativo = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tentativa]);

  const reload = useCallback(() => setTentativa((n) => n + 1), []);

  return { ...state, reload };
}
