import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { formatCurrency } from '../utils/format';

// 11 dígitos = R$ 999.999.999,99, o teto que a API aceita.
const MAX_DIGITOS = 11;

export interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null;
  onChange: (valor: number | null) => void;
}

/**
 * Campo de dinheiro no estilo "caixa eletrônico": cada dígito digitado entra
 * pelos centavos (1 → R$ 0,01; 1999 → R$ 19,99).
 *
 * Evita as três armadilhas do <input type="number"> com dinheiro em pt-BR:
 * vírgula x ponto decimal, terceira casa decimal e o "e" de notação científica.
 * O valor exposto é sempre um número (ou null quando vazio), nunca texto.
 */
const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, ...props },
  ref
) {
  const texto = value === null ? '' : formatCurrency(value);

  const aoMudar = (evento: ChangeEvent<HTMLInputElement>) => {
    const digitos = evento.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_DIGITOS);
    onChange(digitos ? Number(digitos) / 100 : null);
  };

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="R$ 0,00"
      value={texto}
      onChange={aoMudar}
    />
  );
});

export default MoneyInput;
