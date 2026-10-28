const request = require('supertest');
const { start, stop, clear, produtoValido } = require('./helpers/testServer');

let app;
const ID_INEXISTENTE = '6720c1f4a2b9d43c8e1f0a11';

beforeAll(async () => {
  app = await start();
});
afterAll(stop);
beforeEach(clear);

const criar = (dados = {}) => request(app).post('/products').send(produtoValido(dados));
const camposComErro = (res) => res.body.details.map((d) => d.field).sort();
const mensagemDo = (res, campo) => res.body.details.find((d) => d.field === campo)?.message;

describe('POST /products', () => {
  it('cria o produto e responde 201 com Location, ETag e o corpo serializado', async () => {
    const res = await criar();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Fone Bluetooth Pulse',
      description: 'Cancelamento de ruído ativo',
      price: 349.9,
      stock: 25,
      category: 'Eletrônicos',
      inStock: true,
      version: 1,
    });
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body).not.toHaveProperty('_id');
    expect(res.headers.location).toBe(`/products/${res.body.id}`);
    expect(res.headers.etag).toBe('"1"');
    expect(new Date(res.body.createdAt).toString()).not.toBe('Invalid Date');
  });

  it('persiste de verdade (o GET seguinte encontra o produto)', async () => {
    const { body } = await criar();
    const res = await request(app).get(`/products/${body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Fone Bluetooth Pulse');
  });

  it('aceita descrição ausente e grava como texto vazio', async () => {
    const dados = produtoValido();
    delete dados.description;
    const res = await request(app).post('/products').send(dados);
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('');
  });

  it('normaliza espaços no nome e na categoria', async () => {
    const res = await criar({ name: '   Mouse    sem   fio  ', category: '  Informática  ' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Mouse sem fio');
    expect(res.body.category).toBe('Informática');
  });

  it('descarta campos desconhecidos em vez de gravá-los', async () => {
    const res = await criar({ id: ID_INEXISTENTE, version: 99, desconto: 50 });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(ID_INEXISTENTE);
    expect(res.body.version).toBe(1);
    expect(res.body).not.toHaveProperty('desconto');
  });

  it('sem corpo, lista os quatro campos obrigatórios de uma vez', async () => {
    const res = await request(app).post('/products');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(camposComErro(res)).toEqual(['category', 'name', 'price', 'stock']);
  });

  it('JSON malformado responde 400 com mensagem clara', async () => {
    const res = await request(app)
      .post('/products')
      .set('Content-Type', 'application/json')
      .send('{"name": "Quebrado",');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JSON inválido/);
  });

  it('corpo que não é objeto responde 400', async () => {
    const res = await request(app).post('/products').send([produtoValido()]);
    expect(res.status).toBe(400);
  });

  describe('regra: name obrigatório, entre 3 e 120 caracteres', () => {
    it.each([
      ['ausente', undefined, 'Nome é obrigatório'],
      ['vazio', '', 'Nome é obrigatório'],
      ['só espaços', '     ', 'Nome é obrigatório'],
      ['com 2 caracteres', 'TV', 'Nome deve ter pelo menos 3 caracteres'],
      ['com 2 caracteres e espaços nas pontas', '  ab  ', 'Nome deve ter pelo menos 3 caracteres'],
      ['com 121 caracteres', 'a'.repeat(121), 'Nome deve ter no máximo 120 caracteres'],
      ['que não é texto', 12345, 'Nome deve ser um texto'],
    ])('rejeita nome %s', async (_caso, name, mensagem) => {
      const res = await criar({ name });
      expect(res.status).toBe(400);
      expect(mensagemDo(res, 'name')).toBe(mensagem);
    });

    it.each([
      ['3', 'abc'],
      ['120', 'a'.repeat(120)],
    ])('aceita o limite de %s caracteres', async (_limite, name) => {
      const res = await criar({ name });
      expect(res.status).toBe(201);
    });
  });

  describe('regra: price número positivo maior que 0', () => {
    it.each([
      ['zero', 0, 'Preço deve ser maior que zero'],
      ['negativo', -10, 'Preço deve ser maior que zero'],
      ['ausente', undefined, 'Preço é obrigatório'],
      ['nulo', null, 'Preço deve ser um número'],
      ['texto numérico', '10.50', 'Preço deve ser um número'],
      ['texto', 'caro', 'Preço deve ser um número'],
      ['com 3 casas decimais', 10.999, 'Preço deve ter no máximo 2 casas decimais'],
      ['acima do teto', 1e12, 'Preço acima do limite permitido'],
    ])('rejeita preço %s', async (_caso, price, mensagem) => {
      const res = await criar({ price });
      expect(res.status).toBe(400);
      expect(mensagemDo(res, 'price')).toBe(mensagem);
    });

    it.each([0.01, 0.07, 19.9, 1000])('aceita %p', async (price) => {
      const res = await criar({ price });
      expect(res.status).toBe(201);
      expect(res.body.price).toBe(price);
    });
  });

  describe('regra: stock inteiro maior ou igual a 0', () => {
    it.each([
      ['negativo', -1, 'Estoque não pode ser negativo'],
      ['fracionado', 1.5, 'Estoque deve ser um número inteiro'],
      ['ausente', undefined, 'Estoque é obrigatório'],
      ['texto', '5', 'Estoque deve ser um número'],
    ])('rejeita estoque %s', async (_caso, stock, mensagem) => {
      const res = await criar({ stock });
      expect(res.status).toBe(400);
      expect(mensagemDo(res, 'stock')).toBe(mensagem);
    });

    it('aceita estoque zero e marca como sem estoque', async () => {
      const res = await criar({ stock: 0 });
      expect(res.status).toBe(201);
      expect(res.body.inStock).toBe(false);
    });
  });

  describe('regra: category obrigatória e não vazia', () => {
    it.each([
      ['ausente', undefined],
      ['vazia', ''],
      ['só espaços', '   '],
    ])('rejeita categoria %s', async (_caso, category) => {
      const res = await criar({ category });
      expect(res.status).toBe(400);
      expect(mensagemDo(res, 'category')).toBe('Categoria é obrigatória');
    });
  });

  it('devolve um erro por campo quando vários falham juntos', async () => {
    const res = await criar({ name: 'a', price: 0, stock: -1, category: '' });
    expect(res.status).toBe(400);
    expect(camposComErro(res)).toEqual(['category', 'name', 'price', 'stock']);
  });

  it('reaproveita a grafia de uma categoria que já existe', async () => {
    await criar({ category: 'Eletrônicos' });
    const res = await criar({ name: 'Caixa de som', category: 'ELETRÔNICOS' });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Eletrônicos');
  });
});

describe('GET /products', () => {
  const semear = async () => {
    // Criados em sequência: o último é o mais recente.
    await criar({ name: 'Notebook Vortex', price: 4899.9, stock: 12, category: 'Informática' });
    await criar({ name: 'Mouse sem fio', price: 249.9, stock: 0, category: 'Informática', description: 'Sensor óptico' });
    await criar({ name: 'Ábaco de madeira', price: 39.9, stock: 3, category: 'Brinquedos' });
    await criar({ name: 'Cafeteira (expresso)', price: 899, stock: 9, category: 'Casa' });
  };

  it('lista todos os produtos, mais recentes primeiro, com X-Total-Count', async () => {
    await semear();
    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(res.headers['x-total-count']).toBe('4');
    expect(res.body.map((p) => p.name)).toEqual([
      'Cafeteira (expresso)',
      'Ábaco de madeira',
      'Mouse sem fio',
      'Notebook Vortex',
    ]);
  });

  it('com o catálogo vazio devolve lista vazia', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(res.headers['x-total-count']).toBe('0');
  });

  it('busca em nome, descrição e categoria sem diferenciar maiúsculas', async () => {
    await semear();
    const nomes = async (search) =>
      (await request(app).get('/products').query({ search })).body.map((p) => p.name);

    expect(await nomes('MOUSE')).toEqual(['Mouse sem fio']);
    expect(await nomes('óptico')).toEqual(['Mouse sem fio']);
    expect(await nomes('brinquedos')).toEqual(['Ábaco de madeira']);
  });

  it('trata caracteres especiais da busca como texto literal', async () => {
    await semear();
    const res = await request(app).get('/products').query({ search: '(expresso' });
    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.name)).toEqual(['Cafeteira (expresso)']);
  });

  it('filtra por categoria sem diferenciar maiúsculas', async () => {
    await semear();
    const res = await request(app).get('/products').query({ category: 'informática' });
    expect(res.body).toHaveLength(2);
    expect(res.headers['x-total-count']).toBe('2');
  });

  it('filtra por disponibilidade', async () => {
    await semear();
    const esgotados = await request(app).get('/products').query({ inStock: false });
    const disponiveis = await request(app).get('/products').query({ inStock: true });
    expect(esgotados.body.map((p) => p.name)).toEqual(['Mouse sem fio']);
    expect(disponiveis.body).toHaveLength(3);
  });

  it('ordena por preço e por nome respeitando acentos do português', async () => {
    await semear();
    const porPreco = await request(app).get('/products').query({ sort: '-price' });
    expect(porPreco.body.map((p) => p.price)).toEqual([4899.9, 899, 249.9, 39.9]);

    const porNome = await request(app).get('/products').query({ sort: 'name' });
    expect(porNome.body.map((p) => p.name)).toEqual([
      'Ábaco de madeira',
      'Cafeteira (expresso)',
      'Mouse sem fio',
      'Notebook Vortex',
    ]);
  });

  it('pagina sem mudar o formato da resposta e mantém o total no cabeçalho', async () => {
    await semear();
    const pagina2 = await request(app).get('/products').query({ page: 2, limit: 3, sort: 'name' });
    expect(pagina2.status).toBe(200);
    expect(pagina2.headers['x-total-count']).toBe('4');
    expect(pagina2.body.map((p) => p.name)).toEqual(['Notebook Vortex']);
  });

  it.each([
    [{ limit: 0 }, 'limit'],
    [{ limit: 101 }, 'limit'],
    [{ page: 'abc' }, 'page'],
    [{ sort: 'senha' }, 'sort'],
    [{ inStock: 'talvez' }, 'inStock'],
  ])('rejeita parâmetro inválido %p com 400', async (query, campo) => {
    const res = await request(app).get('/products').query(query);
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe(campo);
  });
});

describe('GET /products/:id', () => {
  it('devolve o produto com ETag da versão', async () => {
    const { body } = await criar();
    const res = await request(app).get(`/products/${body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: body.id, name: body.name });
    expect(res.headers.etag).toBe('"1"');
  });

  it('responde 404 para um id que não existe', async () => {
    const res = await request(app).get(`/products/${ID_INEXISTENTE}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Produto não encontrado.',
    });
  });

  it('responde 400 para um id fora do formato', async () => {
    const res = await request(app).get('/products/123');
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('id');
  });
});

describe('PUT /products/:id', () => {
  const atualizacao = produtoValido({
    name: 'Fone Bluetooth Pulse 2',
    description: '',
    price: 299.9,
    stock: 0,
    category: 'Áudio',
  });

  it('substitui o produto, incrementa a versão e devolve o novo ETag', async () => {
    const { body: criado } = await criar();
    const res = await request(app).put(`/products/${criado.id}`).send(atualizacao);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...atualizacao, id: criado.id, version: 2, inStock: false });
    expect(res.headers.etag).toBe('"2"');
    expect(new Date(res.body.updatedAt) >= new Date(criado.updatedAt)).toBe(true);

    const relido = await request(app).get(`/products/${criado.id}`);
    expect(relido.body.name).toBe('Fone Bluetooth Pulse 2');
  });

  it('aplica as mesmas regras da criação', async () => {
    const { body: criado } = await criar();
    const res = await request(app)
      .put(`/products/${criado.id}`)
      .send({ ...atualizacao, name: 'ab', price: -1 });
    expect(res.status).toBe(400);
    expect(camposComErro(res)).toEqual(['name', 'price']);
  });

  it('é substituição completa: corpo parcial responde 400', async () => {
    const { body: criado } = await criar();
    const res = await request(app).put(`/products/${criado.id}`).send({ price: 10 });
    expect(res.status).toBe(400);
    expect(camposComErro(res)).toEqual(['category', 'name', 'stock']);
  });

  it('responde 404 para um id que não existe', async () => {
    const res = await request(app).put(`/products/${ID_INEXISTENTE}`).send(atualizacao);
    expect(res.status).toBe(404);
  });

  it('responde 400 para um id fora do formato', async () => {
    const res = await request(app).put('/products/xyz').send(atualizacao);
    expect(res.status).toBe(400);
  });

  it('deixa o único produto de uma categoria corrigir a capitalização dela', async () => {
    const { body: criado } = await criar({ category: 'eletrônicos' });
    const res = await request(app)
      .put(`/products/${criado.id}`)
      .send({ ...produtoValido(), category: 'Eletrônicos' });
    expect(res.body.category).toBe('Eletrônicos');
  });

  describe('concorrência otimista com If-Match', () => {
    it('grava quando a versão confere', async () => {
      const { body: criado } = await criar();
      const res = await request(app)
        .put(`/products/${criado.id}`)
        .set('If-Match', '"1"')
        .send(atualizacao);
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
    });

    it('responde 412 com a versão atual quando outra pessoa gravou antes', async () => {
      const { body: criado } = await criar();
      // Duas abas abriram a versão 1; a primeira grava.
      await request(app).put(`/products/${criado.id}`).set('If-Match', '"1"').send(atualizacao);

      const res = await request(app)
        .put(`/products/${criado.id}`)
        .set('If-Match', '"1"')
        .send({ ...atualizacao, name: 'Sobrescrita indevida' });

      expect(res.status).toBe(412);
      expect(res.body).toMatchObject({ statusCode: 412, currentVersion: 2 });
      const relido = await request(app).get(`/products/${criado.id}`);
      expect(relido.body.name).toBe('Fone Bluetooth Pulse 2');
    });

    it('aceita * como "qualquer versão"', async () => {
      const { body: criado } = await criar();
      const res = await request(app).put(`/products/${criado.id}`).set('If-Match', '*').send(atualizacao);
      expect(res.status).toBe(200);
    });

    it('responde 400 para um If-Match que não é versão', async () => {
      const { body: criado } = await criar();
      const res = await request(app)
        .put(`/products/${criado.id}`)
        .set('If-Match', 'abc')
        .send(atualizacao);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/If-Match/);
    });

    it('prefere 404 a 412 quando o produto nem existe', async () => {
      const res = await request(app)
        .put(`/products/${ID_INEXISTENTE}`)
        .set('If-Match', '"1"')
        .send(atualizacao);
      expect(res.status).toBe(404);
    });
  });
});

describe('DELETE /products/:id', () => {
  it('remove e responde 204 sem corpo', async () => {
    const { body: criado } = await criar();
    const res = await request(app).delete(`/products/${criado.id}`);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const relido = await request(app).get(`/products/${criado.id}`);
    expect(relido.status).toBe(404);
  });

  it('remover de novo responde 404', async () => {
    const { body: criado } = await criar();
    await request(app).delete(`/products/${criado.id}`);
    const res = await request(app).delete(`/products/${criado.id}`);
    expect(res.status).toBe(404);
  });

  it('responde 400 para um id fora do formato', async () => {
    const res = await request(app).delete('/products/nao-e-id');
    expect(res.status).toBe(400);
  });

  it('não afeta os outros produtos', async () => {
    const { body: a } = await criar({ name: 'Produto A' });
    await criar({ name: 'Produto B' });
    await request(app).delete(`/products/${a.id}`);
    const res = await request(app).get('/products');
    expect(res.body.map((p) => p.name)).toEqual(['Produto B']);
  });
});
