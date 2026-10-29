const express = require('express');
const cors = require('cors');
const { default: helmet } = require('helmet');
const path = require('path');
const fs = require('fs');
const { createHash } = require('crypto');
const { rateLimit } = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./app/config/config');
const router = require('./routes');
const requestLogger = require('./app/helpers/requestLogger');
const BadRequest = require('./app/errors/BadRequest');
const PayloadTooLarge = require('./app/errors/PayloadTooLarge');
const RouteNotFound = require('./app/errors/RouteNotFound');
const TooManyRequests = require('./app/errors/TooManyRequests');
const { respondWithError } = require('./app/helpers/respondWithError');

const FRONTEND_DIR = process.env.FRONTEND_DIR || path.resolve(__dirname, '..', '..', 'frontend', 'dist');

const API_PREFIXES = ['/products', '/categories', '/docs', '/health'];
const MONGO_CONECTADO = 1;
const LIMITE_DO_CORPO = '100kb';
const METODOS_DE_LEITURA = new Set(['GET', 'HEAD', 'OPTIONS']);

const hashesDosScriptsInline = (html) =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    ([, codigo]) => `'sha256-${createHash('sha256').update(codigo).digest('base64')}'`
  );

const origensDoCors = (valor) => {
  if (valor === '*') return '*';
  return valor
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);
};

class App {
  constructor() {
    const indexHtml = path.join(FRONTEND_DIR, 'index.html');
    this.temFrontend = fs.existsSync(indexHtml);
    this.scriptsInline = this.temFrontend ? hashesDosScriptsInline(fs.readFileSync(indexHtml, 'utf8')) : [];
    this.server = express();
    this.middlewares();
    this.health();
    this.routes();
    this.notFound();
    this.frontend();
    this.errorHandler();
  }

  middlewares() {
    this.server.use(requestLogger);
    this.server.use(
      helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", ...this.scriptsInline],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: null,
          },
        },
      })
    );

    const origens = origensDoCors(config.corsOrigin);
    if (origens.length) {
      this.server.use(
        cors({
          origin: origens,
          exposedHeaders: ['X-Total-Count', 'ETag', 'Location', 'X-Request-Id'],
        })
      );
    }

    if (config.rateLimitWritesPerMinute > 0) {
      this.server.use(
        rateLimit({
          windowMs: 60_000,
          limit: config.rateLimitWritesPerMinute,
          standardHeaders: 'draft-7',
          legacyHeaders: false,
          skip: (req) => METODOS_DE_LEITURA.has(req.method),
          handler: (req, res) => respondWithError(res, new TooManyRequests()),
        })
      );
    }

    this.server.use(express.json({ limit: LIMITE_DO_CORPO }));
  }

  health() {
    this.server.get('/health', (req, res) => {
      const conectado = mongoose.connection.readyState === MONGO_CONECTADO;
      res.status(conectado ? 200 : 503).json({
        status: conectado ? 'ok' : 'unavailable',
        produto: config.produto,
        mongo: conectado ? 'connected' : 'disconnected',
        uptime: process.uptime(),
      });
    });
  }

  routes() {
    router(this.server);
  }

  notFound() {
    this.server.use((req, res, next) => {
      const ehApi = API_PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`));
      if (!ehApi && req.method === 'GET' && this.temFrontend) {
        return next();
      }
      return respondWithError(res, new RouteNotFound(req.method, req.path));
    });
  }

  frontend() {
    if (!this.temFrontend) return;
    this.server.use(express.static(FRONTEND_DIR));
    this.server.use((req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
  }

  errorHandler() {
    this.server.use((err, req, res, _next) => {
      if (err?.type === 'entity.parse.failed') {
        return respondWithError(res, new BadRequest('JSON inválido no corpo da requisição.'));
      }
      if (err?.type === 'entity.too.large') return respondWithError(res, new PayloadTooLarge('100 KB'));
      return respondWithError(res, err);
    });
  }
}

module.exports = new App().server;
