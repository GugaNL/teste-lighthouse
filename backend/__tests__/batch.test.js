const request = require('supertest');
const { start, stop, clear, produtoValido } = require('./helpers/testServer');

let app;
const ID_INEXISTENTE = '6720c1f4a2b9d43c8e1f0a11';

beforeAll(async () => {
  app = await start();
});
afterAll(stop);
beforeEach(clear);

const criar = async (dados) => (await request(app).post('/products').send(produtoValido(dados))).body;
const nomesListados = async () =>
  (await request(app).get('/products').query({ sort: 'name' })).body.map((p) => p.name);
const mensagemDo = (res, campo) => res.body.details.find((d) => d.field === campo)?.message;

describe('POST /products/batch/delete', () => {
  it('exclui os selecionados e informa quantos', async () => {
    const a = await criar({ name: 'Produto A' });
    const b = await criar({ name: 'Produto B' });
    await criar({ name: 'Produto C' });

    const res = await request(app)
      .post('/products/batch/delete')
      .send({ ids: [a.id, b.id] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 2 });
    expect(await nomesListados()).toEqual(['Produto C']);
  });

  it('ignora ids inexistentes ou já excluídos', async () => {
    const a = await criar({ name: 'Produto A' });
    await request(app).delete(`/products/${a.id}`);
    const res = await request(app)
      .post('/products/batch/delete')
      .send({ ids: [a.id, ID_INEXISTENTE] });
    expect(res.body).toEqual({ deleted: 0 });
  });

  it.each([
    [{}, 'Informe os ids dos produtos'],
    [{ ids: [] }, 'Selecione pelo menos um produto'],
    [{ ids: 'abc' }, 'ids deve ser uma lista'],
    [{ ids: [ID_INEXISTENTE, ID_INEXISTENTE] }, 'A lista de ids tem repetições'],
  ])('recusa corpo inválido %j', async (corpo, mensagem) => {
    const res = await request(app).post('/products/batch/delete').send(corpo);
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toBe(mensagem);
  });

  it('recusa id fora do formato', async () => {
    const res = await request(app)
      .post('/products/batch/delete')
      .send({ ids: ['nao-e-id'] });
    expect(res.status).toBe(400);
    expect(mensagemDo(res, 'ids.0')).toMatch(/ID inválido/);
  });

  it('recusa mais de 100 ids por vez', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => i.toString(16).padStart(24, '0'));
    const res = await request(app).post('/products/batch/delete').send({ ids });
    expect(res.status).toBe(400);
    expect(mensagemDo(res, 'ids')).toBe('Selecione no máximo 100 produtos por vez');
  });
});

describe('POST /products/batch/restore', () => {
  it('restaura os excluídos e ignora os que não estavam excluídos', async () => {
    const a = await criar({ name: 'Produto A' });
    const b = await criar({ name: 'Produto B' });
    await request(app)
      .post('/products/batch/delete')
      .send({ ids: [a.id] });

    const res = await request(app)
      .post('/products/batch/restore')
      .send({ ids: [a.id, b.id] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ restored: 1 });
    expect(await nomesListados()).toEqual(['Produto A', 'Produto B']);
  });

  it('alinha a grafia da categoria dos restaurados com a que está em uso', async () => {
    const a = await criar({ name: 'Produto A', category: 'casa' });
    const b = await criar({ name: 'Produto B', category: 'casa' });
    const c = await criar({ name: 'Produto C', category: 'Esporte' });
    await request(app)
      .post('/products/batch/delete')
      .send({ ids: [a.id, b.id, c.id] });
    await criar({ name: 'Produto D', category: 'Casa' });

    await request(app)
      .post('/products/batch/restore')
      .send({ ids: [a.id, b.id, c.id] });

    const lista = (await request(app).get('/products').query({ sort: 'name' })).body;
    expect(lista.map((p) => [p.name, p.category])).toEqual([
      ['Produto A', 'Casa'],
      ['Produto B', 'Casa'],
      ['Produto C', 'Esporte'],
      ['Produto D', 'Casa'],
    ]);
  });
});

describe('POST /products/batch/category', () => {
  it('muda a categoria dos selecionados e incrementa a versão de cada um', async () => {
    const a = await criar({ name: 'Produto A', category: 'Casa' });
    const b = await criar({ name: 'Produto B', category: 'Casa' });
    const c = await criar({ name: 'Produto C', category: 'Casa' });

    const res = await request(app)
      .post('/products/batch/category')
      .send({ ids: [a.id, b.id], category: '  Cozinha  ' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 2, category: 'Cozinha' });

    const relidoA = (await request(app).get(`/products/${a.id}`)).body;
    expect(relidoA.category).toBe('Cozinha');
    expect(relidoA.version).toBe(a.version + 1);
    expect((await request(app).get(`/products/${c.id}`)).body.category).toBe('Casa');
  });

  it('reaproveita a grafia de uma categoria que já existe', async () => {
    await criar({ name: 'Produto A', category: 'Eletrônicos' });
    const b = await criar({ name: 'Produto B', category: 'Casa' });
    const res = await request(app)
      .post('/products/batch/category')
      .send({ ids: [b.id], category: 'ELETRÔNICOS' });
    expect(res.body.category).toBe('Eletrônicos');
  });

  it('deixa o lote corrigir a capitalização da categoria que só ele usa', async () => {
    const a = await criar({ name: 'Produto A', category: 'eletronicos' });
    const b = await criar({ name: 'Produto B', category: 'eletronicos' });
    const res = await request(app)
      .post('/products/batch/category')
      .send({ ids: [a.id, b.id], category: 'Eletronicos' });
    expect(res.body).toEqual({ updated: 2, category: 'Eletronicos' });
  });

  it('não mexe em produtos excluídos', async () => {
    const a = await criar({ name: 'Produto A', category: 'Casa' });
    await request(app).delete(`/products/${a.id}`);
    const res = await request(app)
      .post('/products/batch/category')
      .send({ ids: [a.id], category: 'Cozinha' });
    expect(res.body.updated).toBe(0);
  });

  it('aplica as regras da categoria', async () => {
    const a = await criar();
    const res = await request(app)
      .post('/products/batch/category')
      .send({ ids: [a.id], category: '   ' });
    expect(res.status).toBe(400);
    expect(mensagemDo(res, 'category')).toBe('Categoria é obrigatória');
  });
});
