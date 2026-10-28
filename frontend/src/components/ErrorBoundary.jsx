import { Component, useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Erro } from './Estado';

/** Tela de erro de renderização: em vez de tela branca, uma mensagem com saída. */
function TelaDeErro() {
  return (
    <div className="conteudo">
      <Erro
        titulo="A tela encontrou um erro inesperado"
        texto="Recarregue a página para continuar. Se persistir, avise o suporte."
        aoTentar={() => window.location.reload()}
      />
    </div>
  );
}

/**
 * Rede de segurança para erro de renderização fora das rotas (providers).
 * Erros de API não chegam aqui — são tratados nas telas.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('[ui] Erro de renderização:', erro, info?.componentStack);
  }

  render() {
    return this.state.erro ? <TelaDeErro /> : this.props.children;
  }
}

/**
 * O mesmo, para erros dentro das rotas: o roteador de dados captura esses
 * erros antes de qualquer ErrorBoundary e entrega aqui (errorElement).
 */
export function RouteError() {
  const erro = useRouteError();
  useEffect(() => {
    console.error('[ui] Erro de renderização:', erro);
  }, [erro]);
  return <TelaDeErro />;
}
