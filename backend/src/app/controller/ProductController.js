const ProductService = require('../service/ProductService');
const { serialize } = require('../serialize/productSerialize');
const { serializeErrors } = require('../serialize/errorSerialize');
const { etagOf, parseIfMatch } = require('../rules/product');

/**
 * Controller fino: traduz HTTP ↔ service e não decide regra nenhuma.
 *
 * Cada método tem o próprio try/catch (padrão Codex). Os erros de domínio
 * (NotFound, PreconditionFailed...) carregam o statusCode; qualquer outro vira
 * 500 com mensagem genérica, e o detalhe fica só no log do servidor.
 */
class ProductController {
  async getAll(req, res) {
    try {
      const { docs, total } = await ProductService.getAll(req.query);
      res.set('X-Total-Count', String(total));
      return res.status(200).json(docs.map(serialize));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async getById(req, res) {
    try {
      const produto = await ProductService.getById(req.params.id);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async create(req, res) {
    try {
      const produto = await ProductService.create(req.body);
      res.set('ETag', etagOf(produto.version));
      res.location(`${req.baseUrl}/${produto._id}`);
      return res.status(201).json(serialize(produto));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async update(req, res) {
    try {
      const versaoEsperada = parseIfMatch(req.get('If-Match'));
      const produto = await ProductService.update(req.params.id, req.body, versaoEsperada);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async remove(req, res) {
    try {
      await ProductService.remove(req.params.id);
      return res.status(204).end();
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async restore(req, res) {
    try {
      const produto = await ProductService.restore(req.params.id);
      res.set('ETag', etagOf(produto.version));
      return res.status(200).json(serialize(produto));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async removeMany(req, res) {
    try {
      return res.status(200).json(await ProductService.removeMany(req.body.ids));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async restoreMany(req, res) {
    try {
      return res.status(200).json(await ProductService.restoreMany(req.body.ids));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }

  async changeCategory(req, res) {
    try {
      return res.status(200).json(await ProductService.changeCategory(req.body.ids, req.body.category));
    } catch (erro) {
      return responderErro(res, erro);
    }
  }
}

function responderErro(res, erro) {
  if (!erro?.statusCode) console.error('[erro]', erro);
  return res.status(erro?.statusCode || 500).json(serializeErrors(erro));
}

module.exports = new ProductController();
