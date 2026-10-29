const Joi = require('joi');
const { LIMITS, SORT_OPTIONS, STOCK_STATUS, hasAtMostTwoDecimals } = require('../rules/product');

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

const price = Joi.number()
  .strict()
  .positive()
  .max(LIMITS.price.max)
  .custom((valor, helpers) => (hasAtMostTwoDecimals(valor) ? valor : helpers.error('number.twoDecimals')))
  .required()
  .messages({
    'any.required': 'Preço é obrigatório',
    'number.base': 'Preço deve ser um número',
    'number.positive': 'Preço deve ser maior que zero',
    'number.max': 'Preço acima do limite permitido',
    'number.infinity': 'Preço deve ser um número',
    'number.twoDecimals': 'Preço deve ter no máximo 2 casas decimais',
  });

const stock = Joi.number().strict().integer().min(0).max(LIMITS.stock.max).required().messages({
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

const save = Joi.object({ name, description, price, stock, category }).required().messages({
  'object.base': 'O corpo da requisição deve ser um objeto JSON',
  'any.required': 'O corpo da requisição é obrigatório',
});

const listQuery = Joi.object({
  search: Joi.string()
    .trim()
    .max(LIMITS.search.max)
    .allow('')
    .messages({
      'string.max': `Busca deve ter no máximo ${LIMITS.search.max} caracteres`,
    }),
  category: Joi.string().trim().max(LIMITS.category.max).allow(''),
  inStock: Joi.boolean().messages({ 'boolean.base': 'inStock deve ser true ou false' }),
  stockStatus: Joi.string()
    .valid(...STOCK_STATUS)
    .messages({ 'any.only': `stockStatus deve ser um de: ${STOCK_STATUS.join(', ')}` }),
  minPrice: Joi.number().min(0).messages({
    'number.base': 'minPrice deve ser um número maior ou igual a zero',
    'number.min': 'minPrice deve ser um número maior ou igual a zero',
  }),
  maxPrice: Joi.number()
    .min(0)
    .when('minPrice', { is: Joi.exist(), then: Joi.number().min(Joi.ref('minPrice')) })
    .messages({
      'number.base': 'maxPrice deve ser um número maior ou igual a zero',
      'number.min': 'maxPrice deve ser maior ou igual a minPrice',
    }),
  sort: Joi.string()
    .valid(...SORT_OPTIONS)
    .messages({ 'any.only': `sort deve ser um de: ${SORT_OPTIONS.join(', ')}` }),
  page: Joi.number().integer().min(1).messages({
    'number.base': 'page deve ser um inteiro a partir de 1',
    'number.integer': 'page deve ser um inteiro a partir de 1',
    'number.min': 'page deve ser um inteiro a partir de 1',
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(LIMITS.pageSize.max)
    .messages({
      'number.base': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
      'number.integer': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
      'number.min': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
      'number.max': `limit deve ser um inteiro entre 1 e ${LIMITS.pageSize.max}`,
    }),
});

const MENSAGEM_ID = 'ID inválido — deve ter 24 caracteres hexadecimais.';

const ids = Joi.array()
  .items(
    Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.base': MENSAGEM_ID,
        'string.pattern.base': MENSAGEM_ID,
      })
  )
  .min(1)
  .max(LIMITS.batch.max)
  .unique()
  .required()
  .messages({
    'any.required': 'Informe os ids dos produtos',
    'array.base': 'ids deve ser uma lista',
    'array.min': 'Selecione pelo menos um produto',
    'array.max': `Selecione no máximo ${LIMITS.batch.max} produtos por vez`,
    'array.unique': 'A lista de ids tem repetições',
  });

const corpoObjeto = {
  'object.base': 'O corpo da requisição deve ser um objeto JSON',
  'any.required': 'O corpo da requisição é obrigatório',
};

const batchIds = Joi.object({ ids }).required().messages(corpoObjeto);
const batchCategory = Joi.object({ ids, category }).required().messages(corpoObjeto);

module.exports = { save, listQuery, batchIds, batchCategory };
