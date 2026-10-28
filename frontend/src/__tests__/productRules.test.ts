import { describe, expect, it } from 'vitest';
import { productFormSchema, validateProduct } from '../schemas/productSchema';
import type { ProductFormValues } from '../schemas/productSchema';
import { stockStatus, toFormValues } from '../utils/productRules';
import type { Product, ProductField } from '../types/product';

const valido: ProductFormValues = {
  name: 'Fone Bluetooth',
  description: '',
  price: 349.9,
  stock: '25',
  category: 'Eletrônicos',
};
const erroDe = <C extends ProductField>(campo: C, valor: ProductFormValues[C]) =>
  validateProduct({ ...valido, [campo]: valor })[campo] ?? '';

describe('regras do produto no cliente', () => {
  it('aceita um produto válido', () => {
    expect(validateProduct(valido)).toEqual({});
  });

  it.each([
    ['', 'Nome é obrigatório'],
    ['    ', 'Nome é obrigatório'],
    ['TV', 'Nome deve ter pelo menos 3 caracteres'],
    ['  ab  ', 'Nome deve ter pelo menos 3 caracteres'],
    ['a'.repeat(121), 'Nome deve ter no máximo 120 caracteres'],
  ])('nome %j → %s', (nome, mensagem) => {
    expect(erroDe('name', nome)).toBe(mensagem);
  });

  it('aceita nome com exatamente 3 e 120 caracteres', () => {
    expect(erroDe('name', 'abc')).toBe('');
    expect(erroDe('name', 'a'.repeat(120))).toBe('');
  });

  it.each([
    [null, 'Preço é obrigatório'],
    [0, 'Preço deve ser maior que zero'],
    [-1, 'Preço deve ser maior que zero'],
    [10.999, 'Preço deve ter no máximo 2 casas decimais'],
    [1e12, 'Preço acima do limite permitido'],
    [Number.NaN, 'Preço deve ser um número'],
  ])('preço %j → %s', (preco, mensagem) => {
    expect(erroDe('price', preco)).toBe(mensagem);
  });

  it.each([
    ['', 'Estoque é obrigatório'],
    ['-1', 'Estoque não pode ser negativo'],
    ['1.5', 'Estoque deve ser um número inteiro'],
    ['abc', 'Estoque deve ser um número'],
  ])('estoque %j → %s', (estoque, mensagem) => {
    expect(erroDe('stock', estoque)).toBe(mensagem);
  });

  it('aceita estoque zero', () => {
    expect(erroDe('stock', '0')).toBe('');
  });

  it.each(['', '   '])('categoria %j é obrigatória', (categoria) => {
    expect(erroDe('category', categoria)).toBe('Categoria é obrigatória');
  });

  it('a saída do esquema é o corpo da requisição: texto normalizado e estoque em número', () => {
    expect(
      productFormSchema.parse({
        name: '  Mouse   sem fio ',
        description: ' x ',
        price: 10,
        stock: '3',
        category: ' Informática ',
      })
    ).toEqual({ name: 'Mouse sem fio', description: 'x', price: 10, stock: 3, category: 'Informática' });
  });

  it('toFormValues preenche a edição e deixa a criação vazia', () => {
    const produto: Product = {
      id: 'a1',
      name: 'A',
      description: '',
      price: 1,
      stock: 0,
      category: 'B',
      inStock: false,
      version: 1,
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    };
    expect(toFormValues(produto)).toEqual({
      name: 'A',
      description: '',
      price: 1,
      stock: '0',
      category: 'B',
    });
    expect(toFormValues(undefined)).toEqual({
      name: '',
      description: '',
      price: null,
      stock: '',
      category: '',
    });
  });

  it('stockStatus classifica esgotado, baixo e ok', () => {
    expect(stockStatus(0).key).toBe('esgotado');
    expect(stockStatus(5).key).toBe('baixo');
    expect(stockStatus(6).key).toBe('ok');
  });
});
