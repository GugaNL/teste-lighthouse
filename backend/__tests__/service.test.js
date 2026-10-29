const { ProductService } = require('../src/app/service/ProductService');
const NotFound = require('../src/app/errors/NotFound');
const PreconditionFailed = require('../src/app/errors/PreconditionFailed');
const BadRequest = require('../src/app/errors/BadRequest');

const repositorioFalso = (sobrescrever = {}) => ({
  getById: jest.fn().mockResolvedValue(null),
  updateVersioned: jest.fn().mockResolvedValue(null),
  findCategorySpelling: jest.fn().mockResolvedValue(undefined),
  ...sobrescrever,
});

const dados = { name: '  Mouse   sem fio ', description: ' x ', price: 10, stock: 1, category: ' casa ' };

describe('ProductService com repositório injetado (sem banco)', () => {
  it('getById lança NotFound quando o repositório não encontra', async () => {
    const service = new ProductService(repositorioFalso());
    await expect(service.getById('abc')).rejects.toBeInstanceOf(NotFound);
  });

  it('update distingue 404 de 412 com uma segunda leitura', async () => {
    const semProduto = new ProductService(repositorioFalso());
    await expect(semProduto.update('abc', dados, 1)).rejects.toBeInstanceOf(NotFound);

    const outraVersao = new ProductService(
      repositorioFalso({ getById: jest.fn().mockResolvedValue({ version: 4 }) })
    );
    await expect(outraVersao.update('abc', dados, 1)).rejects.toMatchObject({
      constructor: PreconditionFailed,
      currentVersion: 4,
    });
  });

  it('update recusa If-Match ilegível antes de ir ao repositório', async () => {
    const repositorio = repositorioFalso();
    await expect(new ProductService(repositorio).update('abc', dados, NaN)).rejects.toBeInstanceOf(
      BadRequest
    );
    expect(repositorio.updateVersioned).not.toHaveBeenCalled();
  });

  it('normaliza o texto e reaproveita a grafia de categoria que o repositório devolve', async () => {
    const service = new ProductService(
      repositorioFalso({ findCategorySpelling: jest.fn().mockResolvedValue('Casa') })
    );
    expect(await service.normalize(dados)).toEqual({
      name: 'Mouse sem fio',
      description: 'x',
      priceCents: 1000,
      stock: 1,
      category: 'Casa',
    });
  });
});
