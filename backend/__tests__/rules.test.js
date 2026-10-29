const {
  normalizeText,
  hasAtMostTwoDecimals,
  escapeRegex,
  toMongoSort,
  parseIfMatch,
  roundMoney,
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
    expect(toMongoSort('-price')).toEqual({ price: -1, _id: -1 });
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

  it('roundMoney arredonda em centavos', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});
