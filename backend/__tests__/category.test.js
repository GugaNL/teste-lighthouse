const request = require('supertest');
const { start, stop, clear, produtoValido } = require('./helpers/testServer');

let app;

beforeAll(async () => {
  app = await start();
});
afterAll(stop);
beforeEach(clear);

const criar = (dados) => request(app).post('/products').send(produtoValido(dados));

describe('GET /categories', () => {
  it('resume o catálogo por categoria, em ordem alfabética', async () => {
    await criar({ name: 'Notebook', price: 4000, stock: 2, category: 'Informática' });
    await criar({ name: 'Mouse', price: 100.1, stock: 0, category: 'Informática' });
    await criar({ name: 'Teclado', price: 0.1, stock: 3, category: 'informática' });
    await criar({ name: 'Ábaco', price: 39.9, stock: 1, category: 'Brinquedos' });

    const res = await request(app).get('/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { name: 'Brinquedos', products: 1, stock: 1, inventoryValue: 39.9, outOfStock: 0, lowStock: 1 },
      { name: 'Informática', products: 3, stock: 5, inventoryValue: 8000.3, outOfStock: 1, lowStock: 2 },
    ]);
  });

  it('ignora produtos excluídos', async () => {
    const { body: excluido } = await criar({ name: 'Notebook', category: 'Informática' });
    await criar({ name: 'Ábaco', price: 39.9, stock: 1, category: 'Brinquedos' });
    await request(app).delete(`/products/${excluido.id}`);

    const res = await request(app).get('/categories');
    expect(res.body.map((c) => c.name)).toEqual(['Brinquedos']);
  });

  it('com o catálogo vazio devolve lista vazia', async () => {
    const res = await request(app).get('/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
