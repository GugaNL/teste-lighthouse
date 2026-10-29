const fs = require('fs');
const os = require('os');
const path = require('path');
const { createHash } = require('crypto');
const request = require('supertest');
const { start, stop } = require('./helpers/testServer');

const SCRIPT_DO_TEMA = "document.documentElement.dataset.theme = 'dark';";
let app;
let pastaDoFrontend;

beforeAll(async () => {
  pastaDoFrontend = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-'));
  fs.writeFileSync(
    path.join(pastaDoFrontend, 'index.html'),
    `<!doctype html><html><head><script>${SCRIPT_DO_TEMA}</script><script type="module" src="/assets/app.js"></script></head></html>`
  );
  process.env.RATE_LIMIT_WRITES_PER_MINUTE = '2';
  app = await start({ frontendDir: pastaDoFrontend });
});
afterAll(async () => {
  await stop();
  fs.rmSync(pastaDoFrontend, { recursive: true, force: true });
  delete process.env.RATE_LIMIT_WRITES_PER_MINUTE;
});

describe('segurança e rastreio', () => {
  it('envia CSP que libera só o script inline do build, pelo hash', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];
    const hash = createHash('sha256').update(SCRIPT_DO_TEMA).digest('base64');

    expect(res.status).toBe(200);
    expect(csp).toContain(`script-src 'self' 'sha256-${hash}'`);
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('devolve um X-Request-Id gerado ou o recebido, se for válido', async () => {
    const gerado = await request(app).get('/health');
    expect(gerado.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const recebido = await request(app).get('/health').set('X-Request-Id', 'abc-123');
    expect(recebido.headers['x-request-id']).toBe('abc-123');

    const invalido = await request(app).get('/health').set('X-Request-Id', 'tem espaço');
    expect(invalido.headers['x-request-id']).not.toBe('tem espaço');
  });

  it('limita as escritas por minuto, sem limitar as leituras', async () => {
    const escrever = () => request(app).post('/products').send({});
    expect((await escrever()).status).toBe(400);
    expect((await escrever()).status).toBe(400);

    const bloqueada = await escrever();
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toMatchObject({ statusCode: 429, error: 'Too Many Requests' });

    expect((await request(app).get('/products')).status).toBe(200);
  });
});
