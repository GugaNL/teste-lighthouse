const mongoose = require('mongoose');
const { LIMITS, hasAtMostTwoDecimals } = require('../rules/product');

/**
 * Produto do catálogo.
 *
 * A validação de verdade acontece antes, no Joi, onde as mensagens são
 * amigáveis. As restrições repetidas aqui são a última linha de defesa: nenhum
 * caminho que escreva no banco (seed, script, código futuro que esqueça o
 * middleware) consegue gravar um produto que viole as regras do desafio.
 */
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.name.min,
      maxlength: LIMITS.name.max,
    },
    description: { type: String, trim: true, default: '', maxlength: LIMITS.description.max },
    price: {
      type: Number,
      required: true,
      max: LIMITS.price.max,
      validate: {
        validator: (valor) => valor > 0 && hasAtMostTwoDecimals(valor),
        message: 'price deve ser maior que zero e ter no máximo 2 casas decimais',
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      max: LIMITS.stock.max,
      validate: { validator: Number.isInteger, message: 'stock deve ser inteiro' },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.category.min,
      maxlength: LIMITS.category.max,
    },

    // Versão própria em vez do __v do Mongoose: o __v só incrementa quando um
    // array muda, e aqui precisamos de um número que mude a CADA atualização
    // para o If-Match (concorrência otimista) funcionar.
    version: { type: Number, default: 1, min: 1 },

    // Exclusão lógica: o produto excluído some de todas as leituras, mas pode
    // ser restaurado (o "Desfazer" do frontend).
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Ordenação e igualdade em português sem diferenciar maiúsculas: "eletrônicos"
// e "Eletrônicos" são a mesma categoria, e "Ábaco" ordena junto do "A".
const COLLATION = { locale: 'pt', strength: 2 };

ProductSchema.index({ category: 1 }, { collation: COLLATION });
ProductSchema.index({ createdAt: -1, _id: -1 });
ProductSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Product', ProductSchema);
module.exports.COLLATION = COLLATION;
