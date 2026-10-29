const mongoose = require('mongoose');
const { LIMITS, hasAtMostTwoDecimals } = require('../rules/product');

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

    version: { type: Number, default: 1, min: 1 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

const COLLATION = { locale: 'pt', strength: 2 };

ProductSchema.index({ category: 1 }, { collation: COLLATION });
ProductSchema.index({ createdAt: -1, _id: -1 });
ProductSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Product', ProductSchema);
module.exports.COLLATION = COLLATION;
