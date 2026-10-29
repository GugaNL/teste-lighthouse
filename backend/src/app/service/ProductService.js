const ProductRepository = require('../repository/ProductRepository');
const NotFound = require('../errors/NotFound');
const BadRequest = require('../errors/BadRequest');
const PreconditionFailed = require('../errors/PreconditionFailed');
const { normalizeText, roundMoney } = require('../rules/product');

const RECURSO = 'Produto';

class ProductService {
  async getAll(filtros) {
    return ProductRepository.list(filtros);
  }

  async getById(id) {
    const produto = await ProductRepository.getById(id);
    if (!produto) throw new NotFound(RECURSO);
    return produto;
  }

  async create(dados) {
    return ProductRepository.create(await this.normalize(dados));
  }

  /**
   * Substitui o produto inteiro.
   *
   * `expectedVersion` vem do If-Match. Quando o filtro versionado não casa,
   * uma segunda leitura decide a resposta: o produto sumiu (404) ou outra
   * pessoa gravou antes (412, com a versão atual para o cliente decidir).
   */
  async update(id, dados, expectedVersion) {
    if (Number.isNaN(expectedVersion)) {
      throw new BadRequest('Cabeçalho If-Match inválido — use o ETag recebido, por exemplo "3".');
    }

    const atualizado = await ProductRepository.updateVersioned(
      id,
      await this.normalize(dados, id),
      expectedVersion
    );
    if (atualizado) return atualizado;

    const atual = await ProductRepository.getById(id);
    if (!atual) throw new NotFound(RECURSO);
    throw new PreconditionFailed(
      'Este produto foi alterado por outra pessoa enquanto você editava. Recarregue para ver a versão atual.',
      atual.version
    );
  }

  async remove(id) {
    const removido = await ProductRepository.softDelete(id);
    if (!removido) throw new NotFound(RECURSO);
  }

  async restore(id) {
    const restaurado = await ProductRepository.restore(id);
    if (!restaurado) throw new NotFound(RECURSO);
    return restaurado;
  }

  async removeMany(ids) {
    return { deleted: await ProductRepository.softDeleteMany(ids) };
  }

  async restoreMany(ids) {
    return { restored: await ProductRepository.restoreMany(ids) };
  }

  /**
   * Muda a categoria de vários produtos de uma vez, com a mesma normalização
   * da gravação individual. Os próprios produtos selecionados ficam fora da
   * busca de grafia, para o lote conseguir corrigir a capitalização.
   */
  async changeCategory(ids, categoria) {
    const normalizada = normalizeText(categoria);
    const grafiaExistente = await ProductRepository.findCategorySpelling(normalizada, ids);
    const category = grafiaExistente || normalizada;
    return { updated: await ProductRepository.updateCategoryMany(ids, category), category };
  }

  async categories() {
    const grupos = await ProductRepository.categorySummary();
    return grupos.map((g) => ({
      name: g._id,
      products: g.products,
      stock: g.stock,
      // A soma de preço × estoque no Mongo acumula ponto flutuante.
      inventoryValue: roundMoney(g.inventoryValue),
      outOfStock: g.outOfStock,
      lowStock: g.lowStock,
    }));
  }

  /**
   * Normaliza o texto antes de gravar.
   *
   * A categoria é texto livre (o desafio pede só "obrigatória e não vazia"),
   * mas texto livre fragmenta: "eletrônicos", "Eletrônicos" e "ELETRÔNICOS"
   * virariam três filtros. Se a categoria já existe com outra capitalização,
   * a grafia que já está no catálogo é reaproveitada. Na edição o próprio
   * produto fica de fora da busca — senão ele nunca conseguiria corrigir a
   * capitalização da categoria que só ele usa.
   */
  async normalize(dados, idAtual) {
    const category = normalizeText(dados.category);
    const grafiaExistente = await ProductRepository.findCategorySpelling(category, idAtual);

    return {
      name: normalizeText(dados.name),
      description: (dados.description || '').trim(),
      price: dados.price,
      stock: dados.stock,
      category: grafiaExistente || category,
    };
  }
}

module.exports = new ProductService();
