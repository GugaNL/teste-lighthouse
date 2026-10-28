import { Component } from 'react';
import { Erro } from './Estado';

/**
 * Rede de segurança para erro de renderização: em vez de tela branca, uma
 * mensagem com saída. Erros de API não chegam aqui — são tratados nas telas.
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
    if (!this.state.erro) return this.props.children;
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
}
