const { productRepository } = require('../repository/ProductRepository');
const NotFound = require('../errors/NotFound');
const BadRequest = require('../errors/BadRequest');
const PreconditionFailed = require('../errors/PreconditionFailed');
const { normalizeText, toCents, fromCents } = require('../rules/product');

const RECURSO = 'Produto';

class ProductService {
  constructor(repository = productRepository) {
    this.repository = repository;
  }

  async getAll(filtros) {
    return this.repository.list(filtros);
  }

  async getById(id) {
    const produto = await this.repository.getById(id);
    if (!produto) throw new NotFound(RECURSO);
    return produto;
  }

  async create(dados) {
    return this.repository.create(await this.normalize(dados));
  }

  async update(id, dados, expectedVersion) {
    if (Number.isNaN(expectedVersion)) {
      throw new BadRequest('Cabeçalho If-Match inválido — use o ETag recebido, por exemplo "3".');
    }

    const atualizado = await this.repository.updateVersioned(
      id,
      await this.normalize(dados, id),
      expectedVersion
    );
    if (atualizado) return atualizado;

    const atual = await this.repository.getById(id);
    if (!atual) throw new NotFound(RECURSO);
    throw new PreconditionFailed(
      'Este produto foi alterado por outra pessoa enquanto você editava. Recarregue para ver a versão atual.',
      atual.version
    );
  }

  async remove(id) {
    const removido = await this.repository.softDelete(id);
    if (!removido) throw new NotFound(RECURSO);
  }

  async restore(id) {
    const restaurado = await this.repository.restore(id);
    if (!restaurado) throw new NotFound(RECURSO);
    const ajustados = await this.alignCategorySpelling([id]);
    return ajustados ? this.repository.getById(id) : restaurado;
  }

  async removeMany(ids) {
    return { deleted: await this.repository.softDeleteMany(ids) };
  }

  async restoreMany(ids) {
    const restored = await this.repository.restoreMany(ids);
    if (restored) await this.alignCategorySpelling(ids);
    return { restored };
  }

  async alignCategorySpelling(ids) {
    const produtos = await this.repository.findActiveByIds(ids);
    const idsPorCategoria = new Map();
    for (const { _id, category } of produtos) {
      idsPorCategoria.set(category, [...(idsPorCategoria.get(category) || []), _id]);
    }

    let ajustados = 0;
    for (const [categoria, idsDaCategoria] of idsPorCategoria) {
      const grafia = await this.repository.findCategorySpelling(categoria, ids);
      if (grafia && grafia !== categoria) {
        ajustados += await this.repository.updateCategoryMany(idsDaCategoria, grafia);
      }
    }
    return ajustados;
  }

  async changeCategory(ids, categoria) {
    const normalizada = normalizeText(categoria);
    const grafiaExistente = await this.repository.findCategorySpelling(normalizada, ids);
    const category = grafiaExistente || normalizada;
    return { updated: await this.repository.updateCategoryMany(ids, category), category };
  }

  async categories() {
    const grupos = await this.repository.categorySummary();
    return grupos.map((g) => ({
      name: g._id,
      products: g.products,
      stock: g.stock,
      inventoryValue: fromCents(g.inventoryValueCents),
      outOfStock: g.outOfStock,
      lowStock: g.lowStock,
    }));
  }

  async normalize(dados, idAtual) {
    const category = normalizeText(dados.category);
    const grafiaExistente = await this.repository.findCategorySpelling(category, idAtual);

    return {
      name: normalizeText(dados.name),
      description: (dados.description || '').trim(),
      priceCents: toCents(dados.price),
      stock: dados.stock,
      category: grafiaExistente || category,
    };
  }
}

module.exports = { ProductService, productService: new ProductService() };
