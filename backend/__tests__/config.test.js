const ORIGINAL = { ...process.env };

const carregar = (env) => {
  process.env = { ...ORIGINAL, ...env };
  let config;
  jest.isolateModules(() => {
    config = require('../src/app/config/config');
  });
  return config;
};

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('configuração validada na subida', () => {
  it('aplica os padrões de desenvolvimento', () => {
    const config = carregar({
      NODE_ENV: 'development',
      PORT: '',
      CORS_ORIGIN: undefined,
      SEED_ON_START: 'true',
    });
    expect(config).toMatchObject({
      port: 4008,
      corsOrigin: '*',
      seedOnStart: true,
      rateLimitWritesPerMinute: 120,
      deletedRetentionMinutes: 10,
    });
  });

  it('em produção exige MONGO_URL e fecha o CORS por padrão', () => {
    expect(() => carregar({ NODE_ENV: 'production', MONGO_URL: '' })).toThrow(/MONGO_URL é obrigatória/);
    const config = carregar({
      NODE_ENV: 'production',
      MONGO_URL: 'mongodb://banco/catalogo',
      CORS_ORIGIN: undefined,
    });
    expect(config.corsOrigin).toBe('');
  });

  it.each([
    [{ PORT: 'abc' }, /PORT/],
    [{ MONGO_URL: 'postgres://x' }, /mongodb:\/\//],
    [{ LOG_LEVEL: 'barulhento' }, /LOG_LEVEL/],
    [{ RATE_LIMIT_WRITES_PER_MINUTE: '-1' }, /RATE_LIMIT_WRITES_PER_MINUTE/],
    [{ DELETED_RETENTION_MINUTES: '0' }, /DELETED_RETENTION_MINUTES/],
    [{ DELETED_RETENTION_MINUTES: 'dez' }, /DELETED_RETENTION_MINUTES/],
  ])('recusa valor inválido %j', (env, mensagem) => {
    expect(() => carregar({ NODE_ENV: 'development', ...env })).toThrow(mensagem);
  });
});
