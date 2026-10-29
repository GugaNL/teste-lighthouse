const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./app/config/config');
const router = require('./routes');
const requestLogger = require('./app/helpers/requestLogger');
const BadRequest = require('./app/errors/BadRequest');
const PayloadTooLarge = require('./app/errors/PayloadTooLarge');
const RouteNotFound = require('./app/errors/RouteNotFound');
const { respondWithError } = require('./app/helpers/respondWithError');

const FRONTEND_DIR =
  process.env.FRONTEND_DIR || path.resolve(__dirname, '..', '..', 'frontend', 'dist');

const API_PREFIXES = ['/products', '/categories', '/docs', '/health'];
const MONGO_CONECTADO = 1;
const LIMITE_DO_CORPO = '100kb';

class App {
  constructor() {
    this.temFrontend = fs.existsSync(path.join(FRONTEND_DIR, 'index.html'));
    this.server = express();
    this.middlewares();
    this.health();
    this.routes();
    this.notFound();
    this.frontend();
    this.errorHandler();
  }

  middlewares() {
    this.server.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
    this.server.use(
      cors({
        origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
        exposedHeaders: ['X-Total-Count', 'ETag', 'Location'],
      })
    );
    this.server.use(express.json({ limit: LIMITE_DO_CORPO }));
    if (config.nodeEnv !== 'test') this.server.use(requestLogger);
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
    this.server.use((err, req, res, next) => {
      if (err?.type === 'entity.parse.failed') {
        return respondWithError(res, new BadRequest('JSON inválido no corpo da requisição.'));
      }
      if (err?.type === 'entity.too.large') return respondWithError(res, new PayloadTooLarge('100 KB'));
      return respondWithError(res, err);
    });
  }
}

module.exports = new App().server;
