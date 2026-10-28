import type { ReactNode } from 'react';

export interface LoadingProps {
  text?: string;
}

export function Loading({ text = 'Carregando…' }: LoadingProps) {
  return (
    <div className="estado estado--carregando" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  text?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Algo deu errado', text, onRetry }: ErrorStateProps) {
  return (
    <div className="estado estado--erro" role="alert">
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
      {onRetry ? (
        <button type="button" className="botao botao--fantasma" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="estado estado--vazio">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
