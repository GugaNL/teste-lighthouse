/**
 * Regras do produto, sem banco e sem Express.
 *
 * Tudo que é decisão de negócio e cabe numa função pura mora aqui — os limites
 * de cada campo, como o texto é normalizado, quais ordenações a listagem aceita.
 * A validação (Joi), o schema do Mongo e os testes leem destas constantes, então
 * mudar um limite é mudar um número num lugar só.
 */

const LIMITS = Object.freeze({
  name: { min: 3, max: 120 },
  description: { max: 1000 },
  category: { min: 1, max: 60 },
  // Tetos de sanidade: evitam 1e308 no preço e estoque fora do inteiro seguro.
  price: { max: 999_999_999.99 },
  stock: { max: 999_999_999 },
  search: { max: 100 },
  pageSize: { default: 20, max: 100 },
});

// Abaixo disto o frontend sinaliza "estoque baixo". Não é regra da API, mas fica
// aqui para o número existir num lugar só e ir para o resumo de categorias.
const LOW_STOCK_THRESHOLD = 5;

const SORT_FIELDS = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
const SORT_OPTIONS = SORT_FIELDS.flatMap((campo) => [campo, `-${campo}`]);
const DEFAULT_SORT = '-createdAt';

/** Tira espaços das pontas e colapsa os do meio ("Mouse   sem fio" → "Mouse sem fio"). */
const normalizeText = (texto) =>
  typeof texto === 'string' ? texto.trim().replace(/\s+/g, ' ') : texto;

/**
 * Dinheiro tem no máximo duas casas.
 *
 * Comparar `valor * 100` com o inteiro mais próximo falha por ponto flutuante
 * (0.07 * 100 = 7.000000000000001), por isso a tolerância.
 */
const hasAtMostTwoDecimals = (valor) =>
  Number.isFinite(valor) && Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

/** Escapa o texto de busca para virar regex literal — sem injeção de padrão. */
const escapeRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "-price" → { price: -1, _id: -1 }. O _id desempata para a paginação ser estável. */
const toMongoSort = (sort = DEFAULT_SORT) => {
  const opcao = SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SORT;
  const desc = opcao.startsWith('-');
  const campo = desc ? opcao.slice(1) : opcao;
  return { [campo]: desc ? -1 : 1, _id: desc ? -1 : 1 };
};

/**
 * Converte o cabeçalho If-Match na versão esperada.
 *
 * Aceita `"3"`, `3` e `W/"3"`; ausente ou `*` significa "qualquer versão".
 * Devolve `undefined` nesses casos, o número quando dá para ler e `NaN` quando
 * veio algo que não é uma versão (o service transforma isso em 400).
 */
const parseIfMatch = (cabecalho) => {
  if (cabecalho === undefined || cabecalho === null) return undefined;
  const valor = String(cabecalho).trim();
  if (valor === '' || valor === '*') return undefined;
  const match = /^(?:W\/)?"?(\d+)"?$/.exec(valor);
  return match ? Number(match[1]) : NaN;
};

const etagOf = (version) => `"${version}"`;

const roundMoney = (valor) => Math.round(valor * 100) / 100;

module.exports = {
  LIMITS,
  LOW_STOCK_THRESHOLD,
  SORT_OPTIONS,
  DEFAULT_SORT,
  normalizeText,
  hasAtMostTwoDecimals,
  escapeRegex,
  toMongoSort,
  parseIfMatch,
  etagOf,
  roundMoney,
};
