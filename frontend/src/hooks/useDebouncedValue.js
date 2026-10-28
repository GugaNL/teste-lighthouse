import { useEffect, useState } from 'react';

/** Devolve `value` só depois de `delay` ms sem mudanças (busca enquanto digita). */
export function useDebouncedValue(value, delay = 300) {
  const [atrasado, setAtrasado] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return atrasado;
}
