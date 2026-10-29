const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const SPEC_PATH = path.resolve(__dirname, '..', '..', 'docs', 'openapi.yaml');

/**
 * Documentação viva da API.
 *
 * O openapi.yaml é o contrato escrito ANTES do código; servir o mesmo arquivo
 * no Swagger UI garante que a documentação que se lê é a que foi testada, e
 * não uma cópia que envelhece separada.
 */
module.exports = (server, routes, prefix = '/docs') => {
  const spec = YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8'));

  routes.get('/openapi.json', (req, res) => res.json(spec));
  routes.use('/', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Catálogo de Produtos — API' }));

  server.use(prefix, routes);
};
