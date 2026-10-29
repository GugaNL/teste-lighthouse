const request = require('supertest');
const mongoose = require('mongoose');
const { start, stop, clear } = require('./helpers/testServer');

let app;

beforeAll(async () => {
  app = await start();
});
afterAll(stop);
beforeEach(clear);

describe('preço em centavos', () => {
  it('grava o preço como inteiro de centavos e devolve em reais', async () => {
    const { body: criado } = await request(app)
      .post('/products')
      .send({ name: 'Cabo USB', price: 0.07, stock: 1, category: 'Acessórios' });

    const noBanco = await mongoose.model('Product').findById(criado.id).lean();
    expect(noBanco.priceCents).toBe(7);
    expect(noBanco).not.toHaveProperty('price');
    expect(criado.price).toBe(0.07);
  });

  it('migra documentos antigos com preço em reais', async () => {
    const { productRepository } = require('../src/app/repository/ProductRepository');
    const colecao = mongoose.model('Product').collection;
    const agora = new Date();
    await colecao.insertOne({
      name: 'Produto antigo',
      description: '',
      price: 19.9,
      stock: 3,
      category: 'Casa',
      version: 1,
      deletedAt: null,
      createdAt: agora,
      updatedAt: agora,
    });

    expect(await productRepository.migratePriceToCents()).toBe(1);
    expect(await productRepository.migratePriceToCents()).toBe(0);

    const migrado = await colecao.findOne({ name: 'Produto antigo' });
    expect(migrado.priceCents).toBe(1990);
    expect(migrado).not.toHaveProperty('price');
    const res = await request(app).get('/products');
    expect(res.body[0].price).toBe(19.9);
  });
});
