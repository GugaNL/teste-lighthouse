const { productService } = require('../service/ProductService');
const { respondWithError } = require('../helpers/respondWithError');

class CategoryController {
  constructor(service = productService) {
    this.service = service;
  }

  getAll = async (req, res) => {
    try {
      return res.status(200).json(await this.service.categories());
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };
}

module.exports = { CategoryController, categoryController: new CategoryController() };
