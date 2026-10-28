import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { formatCurrency } from '../utils/format';

const MAX_DIGITOS = 11;

export interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null;
  onChange: (valor: number | null) => void;
}

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
