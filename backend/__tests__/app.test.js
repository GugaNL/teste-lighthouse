const request = require('supertest');
const mongoose = require('mongoose');
const { start, stop } = require('./helpers/testServer');

let app;

beforeAll(async () => {
  app = await start();
});
afterAll(stop);

describe('infraestrutura', () => {
  it('GET /health informa a conexão com o banco', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', mongo: 'connected' });
    expect(res.body).not.toHaveProperty('env');
  });

  it('GET /health responde 503 quando o banco está fora do ar', async () => {
    await mongoose.disconnect();
    try {
      const res = await request(app).get('/health');
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ status: 'unavailable', mongo: 'disconnected' });
    } finally {
      await mongoose.connect(process.env.MONGO_URL);
    }
  });

  it('rota inexistente responde 404 em JSON', async () => {
    const res = await request(app).post('/nada-aqui');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
  });

  it('sub-rota inexistente da API não cai no SPA', async () => {
    const res = await request(app).get('/products/6720c1f4a2b9d43c8e1f0a11/extra');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('expõe os cabeçalhos de paginação e versão para o navegador', async () => {
    const res = await request(app).get('/products').set('Origin', 'http://outro-front.dev');
    expect(res.headers['access-control-expose-headers']).toMatch(/X-Total-Count/);
    expect(res.headers['access-control-expose-headers']).toMatch(/ETag/);
  });

  it('serve o contrato OpenAPI com todos os endpoints do desafio', async () => {
    const res = await request(app).get('/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths['/products'])).toEqual(expect.arrayContaining(['get', 'post']));
    expect(Object.keys(res.body.paths['/products/{id}'])).toEqual(
      expect.arrayContaining(['get', 'put', 'delete'])
    );
  });

  it('serve o Swagger UI em /docs', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger-ui/i);
  });
});
