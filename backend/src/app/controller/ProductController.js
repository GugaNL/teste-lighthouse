const { productService } = require('../service/ProductService');
const { serialize } = require('../serialize/productSerialize');
const { respondWithError } = require('../helpers/respondWithError');
const { etagOf, parseIfMatch } = require('../rules/product');

class ProductController {
  constructor(service = productService) {
    this.service = service;
  }

  getAll = async (req, res) => {
    try {
      const { docs, total } = await this.service.getAll(res.locals.query);
      res.set('X-Total-Count', String(total));
      return res.status(200).json(docs.map(serialize));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  getById = async (req, res) => {
    try {
      const produto = await this.service.getById(req.params.id);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  create = async (req, res) => {
    try {
      const produto = await this.service.create(req.body);
      res.set('ETag', etagOf(produto.version));
      res.location(`${req.baseUrl}/${produto._id}`);
      return res.status(201).json(serialize(produto));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  update = async (req, res) => {
    try {
      const versaoEsperada = parseIfMatch(req.get('If-Match'));
      const produto = await this.service.update(req.params.id, req.body, versaoEsperada);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  remove = async (req, res) => {
    try {
      await this.service.remove(req.params.id);
      return res.status(204).end();
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  restore = async (req, res) => {
    try {
      const produto = await this.service.restore(req.params.id);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  removeMany = async (req, res) => {
    try {
      return res.status(200).json(await this.service.removeMany(req.body.ids));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  restoreMany = async (req, res) => {
    try {
      return res.status(200).json(await this.service.restoreMany(req.body.ids));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };

  changeCategory = async (req, res) => {
    try {
      return res.status(200).json(await this.service.changeCategory(req.body.ids, req.body.category));
    } catch (erro) {
      return respondWithError(res, erro);
    }
  };
}

module.exports = { ProductController, productController: new ProductController() };
