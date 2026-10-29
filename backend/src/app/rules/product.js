const LIMITS = Object.freeze({
  name: { min: 3, max: 120 },
  description: { max: 1000 },
  category: { min: 1, max: 60 },
  price: { max: 999_999_999.99 },
  stock: { max: 999_999_999 },
  search: { max: 100 },
  pageSize: { default: 20, max: 100 },
  batch: { max: 100 },
});

const LOW_STOCK_THRESHOLD = 5;

const STOCK_STATUS = ['out', 'low', 'ok'];

const stockCondition = (status) => {
  if (status === 'out') return 0;
  if (status === 'low') return { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
  if (status === 'ok') return { $gt: LOW_STOCK_THRESHOLD };
  return undefined;
};

const SORT_FIELDS = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
const SORT_OPTIONS = SORT_FIELDS.flatMap((campo) => [campo, `-${campo}`]);
const DEFAULT_SORT = '-createdAt';

const normalizeText = (texto) =>
  typeof texto === 'string' ? texto.trim().replace(/\s+/g, ' ') : texto;

const hasAtMostTwoDecimals = (valor) =>
  Number.isFinite(valor) && Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

const escapeRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CAMPO_NO_BANCO = { price: 'priceCents' };

const toMongoSort = (sort = DEFAULT_SORT) => {
  const opcao = SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SORT;
  const desc = opcao.startsWith('-');
  const campo = desc ? opcao.slice(1) : opcao;
  return { [CAMPO_NO_BANCO[campo] ?? campo]: desc ? -1 : 1, _id: desc ? -1 : 1 };
};

const parseIfMatch = (cabecalho) => {
  if (cabecalho === undefined || cabecalho === null) return undefined;
  const valor = String(cabecalho).trim();
  if (valor === '' || valor === '*') return undefined;
  const match = /^(?:W\/)?"?(\d+)"?$/.exec(valor);
  return match ? Number(match[1]) : NaN;
};

const etagOf = (version) => `"${version}"`;

const toCents = (valor) => Math.round(valor * 100);

const fromCents = (centavos) => centavos / 100;

module.exports = {
  LIMITS,
  LOW_STOCK_THRESHOLD,
  STOCK_STATUS,
  stockCondition,
  SORT_OPTIONS,
  DEFAULT_SORT,
  normalizeText,
  hasAtMostTwoDecimals,
  escapeRegex,
  toMongoSort,
  parseIfMatch,
  etagOf,
  toCents,
  fromCents,
};
