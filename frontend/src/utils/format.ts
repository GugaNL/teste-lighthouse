const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const formatCurrency = (valor: number | null | undefined): string =>
  typeof valor === 'number' && Number.isFinite(valor) ? moeda.format(valor) : '—';

export const formatNumber = (valor: number | null | undefined): string =>
  typeof valor === 'number' && Number.isFinite(valor) ? inteiro.format(valor) : '—';

export const formatDateTime = (iso: string | null | undefined): string => {
  const data = iso ? new Date(iso) : null;
  return data && !Number.isNaN(data.getTime()) ? dataHora.format(data) : '—';
};

export const plural = (n: number, singular: string, pluralForma = `${singular}s`): string =>
  `${formatNumber(n)} ${n === 1 ? singular : pluralForma}`;
