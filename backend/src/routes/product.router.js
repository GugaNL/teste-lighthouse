const ProductController = require('../app/controller/ProductController');
const idValidation = require('../app/validation/getIdValid');
const { validate } = require('../app/validation/validate');
const productValidation = require('../app/validation/product');

// Rotas exatamente como no contrato do desafio: /products, sem prefixo.
module.exports = (server, routes, prefix = '/products') => {
  routes.get('/', validate(productValidation.listQuery, 'query'), ProductController.getAll);
  routes.get('/:id', idValidation, ProductController.getById);
  routes.post('/', validate(productValidation.save), ProductController.create);
  routes.put('/:id', idValidation, validate(productValidation.save), ProductController.update);
  routes.delete('/:id', idValidation, ProductController.remove);

  // Operações em lote (seleção múltipla do frontend). Antes de /:id/restore,
  // senão "/batch/restore" casaria com ela (id = "batch").
  routes.post('/batch/delete', validate(productValidation.batchIds), ProductController.removeMany);
  routes.post('/batch/restore', validate(productValidation.batchIds), ProductController.restoreMany);
  routes.post('/batch/category', validate(productValidation.batchCategory), ProductController.changeCategory);
  routes.post('/:id/restore', idValidation, ProductController.restore);

  server.use(prefix, routes);
};
