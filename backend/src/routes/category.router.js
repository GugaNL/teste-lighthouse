const { categoryController: CategoryController } = require('../app/controller/CategoryController');

module.exports = (server, routes, prefix = '/categories') => {
  routes.get('/', CategoryController.getAll);

  server.use(prefix, routes);
};
