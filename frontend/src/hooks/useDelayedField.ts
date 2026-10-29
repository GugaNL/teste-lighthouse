import { useState } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';

export interface DelayedField<T> {
  value: T;
  setValue: (valor: T) => void;
  reset: (valor: T) => void;
}

export function useDelayedField<T>(
  valorAplicado: T,
  aplicar: (valor: T) => void,
  normalizar: (valor: T) => T = (valor) => valor,
  atrasoMs = 350
): DelayedField<T> {
  const [value, setValorLocal] = useState(valorAplicado);
  const [conhecido, setConhecido] = useState(valorAplicado);
  const [ultimoEnviado, setUltimoEnviado] = useState(valorAplicado);

  if (!Object.is(valorAplicado, conhecido)) {
    setConhecido(valorAplicado);
    if (!Object.is(valorAplicado, ultimoEnviado)) setValorLocal(valorAplicado);
  }

  const envio = useDebouncedCallback((valor: T) => {
    const normalizado = normalizar(valor);
    if (Object.is(normalizado, valorAplicado)) return;
    setUltimoEnviado(normalizado);
    aplicar(normalizado);
  }, atrasoMs);

  const setValue = (valor: T) => {
    setValorLocal(valor);
    envio.run(valor);
  };

  const reset = (valor: T) => {
    envio.cancel();
    setValorLocal(valor);
    setUltimoEnviado(valor);
  };

  return { value, setValue, reset };
}
