const request = require('supertest');
const mongoose = require('mongoose');
const { start, stop, clear, produtoValido } = require('./helpers/testServer');

let app;
let productRepository;

const colecao = () => mongoose.model('Product').collection;
const indiceDaLixeira = async () =>
  (await colecao().indexes()).find((indice) => indice.name === 'expira_excluidos');

const esperarAte = async (condicao, prazoMs = 15_000) => {
  const limite = Date.now() + prazoMs;
  while (Date.now() < limite) {
    if (await condicao()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

beforeAll(async () => {
  app = await start({ mongodArgs: ['--setParameter', 'ttlMonitorSleepSecs=1'] });
  ({ productRepository } = require('../src/app/repository/ProductRepository'));
});
afterAll(stop);
beforeEach(async () => {
  await clear();
  await colecao()
    .dropIndex('expira_excluidos')
    .catch(() => {});
});

describe('lixeira com expiração', () => {
  it('cria o índice TTL só para os excluídos', async () => {
    expect(await productRepository.ensureTrashExpiration(600)).toBe('created');

    expect(await indiceDaLixeira()).toMatchObject({
      key: { deletedAt: 1 },
      expireAfterSeconds: 600,
      partialFilterExpression: { deletedAt: { $type: 'date' } },
    });
  });

  it('não mexe no índice quando o prazo é o mesmo e atualiza quando muda', async () => {
    await productRepository.ensureTrashExpiration(600);

    expect(await productRepository.ensureTrashExpiration(600)).toBe('unchanged');
    expect(await productRepository.ensureTrashExpiration(60)).toBe('updated');
    expect((await indiceDaLixeira()).expireAfterSeconds).toBe(60);
  });

  it('funciona com a coleção ainda vazia', async () => {
    await colecao()
      .drop()
      .catch(() => {});
    expect(await productRepository.ensureTrashExpiration(600)).toBe('created');
  });

  it('apaga do banco o produto excluído e mantém os ativos', async () => {
    await productRepository.ensureTrashExpiration(1);
    const { body: excluido } = await request(app)
      .post('/products')
      .send(produtoValido({ name: 'Vai sumir' }));
    const { body: ativo } = await request(app)
      .post('/products')
      .send(produtoValido({ name: 'Continua' }));
    await request(app).delete(`/products/${excluido.id}`).expect(204);

    const id = (texto) => new mongoose.Types.ObjectId(texto);
    const sumiu = await esperarAte(async () => !(await colecao().findOne({ _id: id(excluido.id) })));

    expect(sumiu).toBe(true);
    expect(await colecao().findOne({ _id: id(ativo.id) })).not.toBeNull();
    await request(app).post(`/products/${excluido.id}/restore`).expect(404);
  });
});
