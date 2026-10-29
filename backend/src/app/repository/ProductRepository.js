const ProductSchema = require('../schema/ProductSchema');
const Repository = require('./GenericRepository');
const { escapeRegex, toMongoSort, stockCondition, LIMITS, LOW_STOCK_THRESHOLD } = require('../rules/product');

const { COLLATION } = ProductSchema;

const ATIVO = { deletedAt: null };
const SEM_TIMESTAMPS = { timestamps: false };

class ProductRepository extends Repository {
  constructor() {
    super(ProductSchema);
  }

  static buildQuery({ search, category, inStock, stockStatus, minPrice, maxPrice } = {}) {
    const query = { ...ATIVO };

    if (search) {
      const termo = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ name: termo }, { description: termo }, { category: termo }];
    }
    if (category) query.category = category;
    if (inStock === true) query.stock = { $gt: 0 };
    if (inStock === false) query.stock = 0;
    if (stockStatus) query.stock = stockCondition(stockStatus);
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    return query;
  }

  async list({ page, limit, sort, ...filtros } = {}) {
    const query = ProductRepository.buildQuery(filtros);
    const consulta = ProductSchema.find(query).sort(toMongoSort(sort)).collation(COLLATION).lean();

    const paginado = page !== undefined || limit !== undefined;
    if (paginado) {
      const tamanho = limit || LIMITS.pageSize.default;
      consulta.skip(((page || 1) - 1) * tamanho).limit(tamanho);
    }

    const [docs, total] = await Promise.all([
      consulta,
      ProductSchema.countDocuments(query).collation(COLLATION),
    ]);
    return { docs, total };
  }

  async getById(id) {
    return ProductSchema.findOne({ _id: id, ...ATIVO });
  }

  async findCategorySpelling(category, exceto) {
    const filtro = { category, ...ATIVO };
    if (Array.isArray(exceto)) filtro._id = { $nin: exceto };
    else if (exceto) filtro._id = { $ne: exceto };
    const existente = await ProductSchema.findOne(filtro)
      .collation(COLLATION)
      .sort({ createdAt: 1 })
      .select('category')
      .lean();
    return existente?.category;
  }

  async updateVersioned(id, payload, expectedVersion) {
    const filtro = { _id: id, ...ATIVO };
    if (expectedVersion !== undefined) filtro.version = expectedVersion;

    return ProductSchema.findOneAndUpdate(
      filtro,
      { $set: payload, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
  }

  async softDelete(id) {
    return ProductSchema.findOneAndUpdate(
      { _id: id, ...ATIVO },
      { $set: { deletedAt: new Date() } },
      SEM_TIMESTAMPS
    );
  }

  async restore(id) {
    return ProductSchema.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true, ...SEM_TIMESTAMPS }
    );
  }

  async softDeleteMany(ids) {
    const { modifiedCount } = await ProductSchema.updateMany(
      { _id: { $in: ids }, ...ATIVO },
      { $set: { deletedAt: new Date() } },
      SEM_TIMESTAMPS
    );
    return modifiedCount;
  }

  async restoreMany(ids) {
    const { modifiedCount } = await ProductSchema.updateMany(
      { _id: { $in: ids }, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      SEM_TIMESTAMPS
    );
    return modifiedCount;
  }

  async findActiveByIds(ids) {
    return ProductSchema.find({ _id: { $in: ids }, ...ATIVO })
      .select('category')
      .lean();
  }

  async updateCategoryMany(ids, category) {
    const { modifiedCount } = await ProductSchema.updateMany(
      { _id: { $in: ids }, ...ATIVO },
      { $set: { category }, $inc: { version: 1 } },
      { runValidators: true }
    );
    return modifiedCount;
  }

  async categorySummary() {
    return ProductSchema.aggregate([
      { $match: ATIVO },
      {
        $group: {
          _id: '$category',
          products: { $sum: 1 },
          stock: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', LOW_STOCK_THRESHOLD] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]).collation(COLLATION);
  }
}

module.exports = new ProductRepository();
