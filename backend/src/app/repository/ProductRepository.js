const ProductSchema = require('../schema/ProductSchema');
const Repository = require('./GenericRepository');
const {
  escapeRegex,
  toMongoSort,
  stockCondition,
  toCents,
  LIMITS,
  LOW_STOCK_THRESHOLD,
} = require('../rules/product');

const { COLLATION } = ProductSchema;

const ATIVO = { deletedAt: null };
const SEM_TIMESTAMPS = { timestamps: false };
const INDICE_DA_LIXEIRA = 'expira_excluidos';
const NAMESPACE_INEXISTENTE = 26;

/**
 * @typedef {object} ProductFilters
 * @property {string} [search]
 * @property {string} [category]
 * @property {boolean} [inStock]
 * @property {'out' | 'low' | 'ok'} [stockStatus]
 * @property {number} [minPrice]
 * @property {number} [maxPrice]
 *
 * @typedef {ProductFilters & { page?: number, limit?: number, sort?: string }} ProductListParams
 * @typedef {Record<string, any>} MongoFilter
 */

class ProductRepository extends Repository {
  constructor() {
    super(ProductSchema);
  }

  /**
   * @param {ProductFilters} [filtros]
   * @returns {MongoFilter}
   */
  static buildQuery({ search, category, inStock, stockStatus, minPrice, maxPrice } = {}) {
    /** @type {MongoFilter} */
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
      query.priceCents = {};
      if (minPrice !== undefined) query.priceCents.$gte = toCents(minPrice);
      if (maxPrice !== undefined) query.priceCents.$lte = toCents(maxPrice);
    }

    return query;
  }

  /** @param {ProductListParams} [params] */
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
    return ProductSchema.findOne({ _id: id, ...ATIVO }).lean();
  }

  async findCategorySpelling(category, exceto) {
    /** @type {MongoFilter} */
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
    /** @type {MongoFilter} */
    const filtro = { _id: id, ...ATIVO };
    if (expectedVersion !== undefined) filtro.version = expectedVersion;

    return ProductSchema.findOneAndUpdate(
      filtro,
      { $set: payload, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).lean();
  }

  async softDelete(id) {
    return ProductSchema.findOneAndUpdate(
      { _id: id, ...ATIVO },
      { $set: { deletedAt: new Date() } },
      SEM_TIMESTAMPS
    ).lean();
  }

  async restore(id) {
    return ProductSchema.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true, ...SEM_TIMESTAMPS }
    ).lean();
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

  /**
   * Índice TTL que apaga do banco os produtos excluídos há mais de `segundos`.
   * Fica fora do schema porque o prazo vem da configuração e o MongoDB não
   * recria um índice TTL com outro prazo: a mudança é feita com `collMod`.
   *
   * @param {number} segundos
   * @returns {Promise<'created' | 'updated' | 'unchanged'>}
   */
  async ensureTrashExpiration(segundos) {
    const colecao = ProductSchema.collection;
    const indices = await colecao.indexes().catch((erro) => {
      if (erro?.code === NAMESPACE_INEXISTENTE) return [];
      throw erro;
    });
    const atual = indices.find((indice) => indice.name === INDICE_DA_LIXEIRA);

    if (!atual) {
      await colecao.createIndex(
        { deletedAt: 1 },
        {
          name: INDICE_DA_LIXEIRA,
          expireAfterSeconds: segundos,
          partialFilterExpression: { deletedAt: { $type: 'date' } },
        }
      );
      return 'created';
    }
    if (atual.expireAfterSeconds === segundos) return 'unchanged';

    const banco = ProductSchema.db.db;
    if (!banco) throw new Error('MongoDB não conectado');
    await banco.command({
      collMod: colecao.collectionName,
      index: { name: INDICE_DA_LIXEIRA, expireAfterSeconds: segundos },
    });
    return 'updated';
  }

  async migratePriceToCents() {
    const { modifiedCount } = await ProductSchema.collection.updateMany(
      { priceCents: { $exists: false }, price: { $type: 'number' } },
      [
        { $set: { priceCents: { $toLong: { $round: [{ $multiply: ['$price', 100] }, 0] } } } },
        { $unset: 'price' },
      ]
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
          inventoryValueCents: { $sum: { $multiply: ['$priceCents', '$stock'] } },
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

module.exports = { ProductRepository, productRepository: new ProductRepository() };
