const {
  normalizeText,
  hasAtMostTwoDecimals,
  escapeRegex,
  toMongoSort,
  parseIfMatch,
  toCents,
  fromCents,
} = require('../src/app/rules/product');

describe('regras puras do produto', () => {
  it('normalizeText tira espaços das pontas e colapsa os do meio', () => {
    expect(normalizeText('  Mouse   sem\tfio  ')).toBe('Mouse sem fio');
    expect(normalizeText(undefined)).toBeUndefined();
  });

  it('hasAtMostTwoDecimals tolera o ruído de ponto flutuante', () => {
    expect(hasAtMostTwoDecimals(0.07)).toBe(true);
    expect(hasAtMostTwoDecimals(19.9)).toBe(true);
    expect(hasAtMostTwoDecimals(1.005)).toBe(false);
    expect(hasAtMostTwoDecimals(Infinity)).toBe(false);
  });

  it('escapeRegex transforma a busca em texto literal', () => {
    const padrao = new RegExp(escapeRegex('a.b*(c)'));
    expect(padrao.test('a.b*(c)')).toBe(true);
    expect(padrao.test('axbbbc')).toBe(false);
  });

  it('toMongoSort traduz a opção e desempata pelo _id', () => {
    expect(toMongoSort('-price')).toEqual({ priceCents: -1, _id: -1 });
    expect(toMongoSort('name')).toEqual({ name: 1, _id: 1 });
    expect(toMongoSort('qualquer')).toEqual({ createdAt: -1, _id: -1 });
  });

  it.each([
    [undefined, undefined],
    ['*', undefined],
    ['"3"', 3],
    ['3', 3],
    ['W/"12"', 12],
  ])('parseIfMatch(%p) = %p', (entrada, esperado) => {
    expect(parseIfMatch(entrada)).toBe(esperado);
  });

  it('parseIfMatch devolve NaN para o que não é versão', () => {
    expect(parseIfMatch('abc')).toBeNaN();
  });

  it('toCents e fromCents convertem sem resíduo de ponto flutuante', () => {
    expect(toCents(0.07)).toBe(7);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(999_999_999.99)).toBe(99_999_999_999);
    expect(fromCents(34990)).toBe(349.9);
  });
});
