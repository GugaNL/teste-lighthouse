import { Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorState } from './Feedback';

function ErrorScreen() {
  return (
    <div className="conteudo">
      <ErrorState
        title="A tela encontrou um erro inesperado"
        text="Recarregue a página para continuar. Se persistir, avise o suporte."
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  erro: unknown;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { erro: null };

  static getDerivedStateFromError(erro: unknown): ErrorBoundaryState {
    return { erro };
  }

  override componentDidCatch(erro: unknown, info: ErrorInfo) {
    console.error('[ui] Erro de renderização:', erro, info.componentStack);
  }

  override render() {
    return this.state.erro ? <ErrorScreen /> : this.props.children;
  }
}

export function RouteError() {
  const erro = useRouteError();
  useEffect(() => {
    console.error('[ui] Erro de renderização:', erro);
  }, [erro]);
  return <ErrorScreen />;
}
