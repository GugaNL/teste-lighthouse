const Joi = require('joi');
const { LIMITS, SORT_OPTIONS, hasAtMostTwoDecimals } = require('../rules/product');

/**
 * Esquemas de validação do produto.
 *
 * O mesmo `save` vale para POST e PUT: o PUT é substituição completa, então
 * as regras são idênticas — e é isso que permite o frontend usar um único
 * formulário para criar e editar.
 *
 * As mensagens saem em português porque vão direto para a tela, embaixo do
 * campo que falhou.
 */

const name = Joi.string()
  .trim()
  .min(LIMITS.name.min)
  .max(LIMITS.name.max)
  .required()
  .messages({
    'any.required': 'Nome é obrigatório',
    'string.empty': 'Nome é obrigatório',
    'string.base': 'Nome deve ser um texto',
    'string.min': `Nome deve ter pelo menos ${LIMITS.name.min} caracteres`,
    'string.max': `Nome deve ter no máximo ${LIMITS.name.max} caracteres`,
  });

const description = Joi.string()
  .trim()
  .max(LIMITS.description.max)
  .allow('', null)
  .empty(null)
  .default('')
  .messages({
    'string.base': 'Descrição deve ser um texto',
    'string.max': `Descrição deve ter no máximo ${LIMITS.description.max} caracteres`,
  });

// `strict()` nos números: "10" (texto) não vira 10 em silêncio. O contrato é
// JSON, e preço que chega como texto é sinal de cliente com bug.
const price = Joi.number()
  .strict()
  .positive()
  .max(LIMITS.price.max)
  .custom((valor, helpers) =>
    hasAtMostTwoDecimals(valor) ? valor : helpers.error('number.twoDecimals')
  )
  .required()
  .messages({
    'any.required': 'Preço é obrigatório',
    'number.base': 'Preço deve ser um número',
    'number.positive': 'Preço deve ser maior que zero',
    'number.max': 'Preço acima do limite permitido',
    'number.infinity': 'Preço deve ser um número',
    'number.twoDecimals': 'Preço deve ter no máximo 2 casas decimais',
  });

const stock = Joi.number()
  .strict()
  .integer()
  .min(0)
  .max(LIMITS.stock.max)
  .required()
  .messages({
    'any.required': 'Estoque é obrigatório',
    'number.base': 'Estoque deve ser um número',
    'number.integer': 'Estoque deve ser um número inteiro',
    'number.min': 'Estoque não pode ser negativo',
    'number.max': 'Estoque acima do limite permitido',
    'number.unsafe': 'Estoque acima do limite permitido',
    'number.infinity': 'Estoque deve ser um número',
  });

const category = Joi.string()
  .trim()
  .min(LIMITS.category.min)
  .max(LIMITS.category.max)
  .required()
  .messages({
    'any.required': 'Categoria é obrigatória',
    'string.empty': 'Categoria é obrigatória',
    'string.base': 'Categoria deve ser um texto',
    'string.max': `Categoria deve ter no máximo ${LIMITS.category.max} caracteres`,
  });

const save = Joi.object({ name, description, price, stock, category })
  .required()
  .messages({
    'object.base': 'O corpo da requisição deve ser um objeto JSON',
    'any.required': 'O corpo da requisição é obrigatório',
  });

// Query string chega sempre como texto, então aqui a conversão é bem-vinda.
const listQuery = Joi.object({
  search: Joi.string().trim().max(LIMITS.search.max).allow('').messages({
    'string.max': `Busca deve ter no máximo ${LIMITS.search.max} caracteres`,
  }),
  category: Joi.string().trim().max(LIMITS.category.max).allow(''),
  inStock: Joi.boolean().messages({ 'boolean.base': 'inStock deve ser true ou false' }),
  sort: Joi.string()
    .valid(...SORT_OPTIONS)
    .messages({ 'any.only': `sort deve ser um de: ${SORT_OPTIONS.join(', ')}` }),
  page: Joi.number().integer().min(1).messages({
    'number.base': 'page deve ser um inteiro a partir de 1',
    'number.integer': 'page deve ser um inteiro a partir de 1',
    'number.min': 'page deve ser um inteiro a partir de 1',
  }),
  limit: Joi.number().integer().min(1).max(LIMITS.pageSize.max).messages({
    'number.base': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
    'number.integer': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
    'number.min': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
    'number.max': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
  }),
});

module.exports = { save, listQuery };
