const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const SPEC_PATH = path.resolve(__dirname, '..', '..', 'docs', 'openapi.yaml');

module.exports = (server, routes, prefix = '/docs') => {
  const spec = YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8'));

  routes.get('/openapi.json', (req, res) => res.json(spec));
  routes.use('/', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Catálogo de Produtos — API' }));

  server.use(prefix, routes);
};
