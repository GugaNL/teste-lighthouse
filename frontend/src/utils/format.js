const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const formatCurrency = (valor) => (Number.isFinite(valor) ? moeda.format(valor) : '—');

export const formatNumber = (valor) => (Number.isFinite(valor) ? inteiro.format(valor) : '—');

export const formatDateTime = (iso) => {
  const data = iso ? new Date(iso) : null;
  return data && !Number.isNaN(data.getTime()) ? dataHora.format(data) : '—';
};

/** Concordância simples: plural(1, 'produto') → "1 produto"; plural(3, ...) → "3 produtos". */
export const plural = (n, singular, pluralForma = `${singular}s`) =>
  `${formatNumber(n)} ${n === 1 ? singular : pluralForma}`;
