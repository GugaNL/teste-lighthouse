const ProductSchema = require('../schema/ProductSchema');
const Repository = require('./GenericRepository');
const { escapeRegex, toMongoSort, LIMITS } = require('../rules/product');

const { COLLATION } = ProductSchema;

class ProductRepository extends Repository {
  constructor() {
    super(ProductSchema);
  }

  /** Monta o filtro do Mongo a partir dos parâmetros já validados da listagem. */
  static buildQuery({ search, category, inStock } = {}) {
    const query = {};

    if (search) {
      const termo = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ name: termo }, { description: termo }, { category: termo }];
    }
    // Igualdade simples: a collation da consulta já ignora maiúsculas.
    if (category) query.category = category;
    if (inStock === true) query.stock = { $gt: 0 };
    if (inStock === false) query.stock = 0;

    return query;
  }

  /**
   * Lista com filtros, ordenação e paginação opcional.
   *
   * Sem `page` nem `limit` devolve tudo — é o "lista todos os produtos" do
   * contrato. O total sai numa contagem à parte para o cabeçalho X-Total-Count.
   */
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

  /** Grafia já usada no catálogo para esta categoria, se existir. */
  async findCategorySpelling(category, excetoId) {
    const filtro = { category };
    if (excetoId) filtro._id = { $ne: excetoId };
    const existente = await ProductSchema.findOne(filtro)
      .collation(COLLATION)
      .sort({ createdAt: 1 })
      .select('category')
      .lean();
    return existente?.category;
  }

  /**
   * Atualização com concorrência otimista.
   *
   * Com `expectedVersion` o filtro só casa se ninguém gravou desde que o
   * cliente leu o produto — a checagem e a escrita são UMA operação atômica no
   * Mongo, sem janela entre "ler a versão" e "gravar". Devolve null tanto para
   * "não existe" quanto para "versão mudou"; quem chama distingue os dois.
   */
  async updateVersioned(id, payload, expectedVersion) {
    const filtro = { _id: id };
    if (expectedVersion !== undefined) filtro.version = expectedVersion;

    return ProductSchema.findOneAndUpdate(
      filtro,
      { $set: payload, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
  }

  /** Resumo por categoria: quantidade, unidades, valor em estoque e esgotados. */
  async categorySummary() {
    return ProductSchema.aggregate([
      {
        $group: {
          _id: '$category',
          products: { $sum: 1 },
          stock: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).collation(COLLATION);
  }
}

module.exports = new ProductRepository();
