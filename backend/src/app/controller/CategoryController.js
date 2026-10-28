const ProductService = require('../service/ProductService');
const { serializeErrors } = require('../serialize/errorSerialize');

class CategoryController {
  async getAll(req, res) {
    try {
      const categorias = await ProductService.categories();
      return res.status(200).json(categorias);
    } catch (erro) {
      if (!erro?.statusCode) console.error('[erro]', erro);
      return res.status(erro?.statusCode || 500).json(serializeErrors(erro));
    }
  }
}

module.exports = new CategoryController();
