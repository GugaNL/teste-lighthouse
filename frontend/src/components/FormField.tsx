import type { ReactNode } from 'react';

export interface FieldControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
  'aria-required': true | undefined;
}

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: { current: number; max: number };
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}

/**
 * Moldura de um campo de formulário: rótulo, dica, contador e erro.
 *
 * O input em si vem como função (`children(props)`) para receber os atributos
 * de acessibilidade já ligados — aria-invalid e aria-describedby apontando
 * para a dica e para a mensagem de erro — sem cada formulário repetir isso.
 */
export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  counter,
  className = '',
  children,
}: FormFieldProps) {
  const dicaId = hint ? `${id}-dica` : undefined;
  const erroId = error ? `${id}-erro` : undefined;
  const descritoPor = [erroId, dicaId].filter(Boolean).join(' ') || undefined;
  const excedeu = counter && counter.current > counter.max;

  return (
    <div className={`campo ${error ? 'campo--invalido' : ''} ${className}`.trim()}>
      <div className="campo__topo">
        <label htmlFor={id} className="campo__rotulo">
          {label}
          {required ? (
            <span className="campo__obrigatorio" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        {counter ? (
          <span className={`campo__contador ${excedeu ? 'is-excedido' : ''}`} aria-hidden="true">
            {counter.current}/{counter.max}
          </span>
        ) : null}
      </div>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': descritoPor,
        'aria-required': required || undefined,
      })}

      {error ? (
        <p id={erroId} className="campo__erro">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={dicaId} className="campo__dica">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
