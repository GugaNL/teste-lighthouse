const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./app/config/config');
const router = require('./routes');
const requestLogger = require('./app/helpers/requestLogger');
const { serializeErrors } = require('./app/serialize/errorSerialize');

require('./infra/database/mongo');

const FRONTEND_DIR =
  process.env.FRONTEND_DIR || path.resolve(__dirname, '..', '..', 'frontend', 'dist');

const API_PREFIXES = ['/products', '/categories', '/docs', '/health'];

class App {
  constructor() {
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
    this.server.use(express.json({ limit: '100kb' }));
    if (config.nodeEnv !== 'test') this.server.use(requestLogger);
  }

  health() {
    this.server.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        produto: config.produto,
        mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        env: config.nodeEnv,
      });
    });
  }

  routes() {
    router(this.server);
  }

  notFound() {
    this.server.use((req, res, next) => {
      const ehApi = API_PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`));
      if (!ehApi && req.method === 'GET' && fs.existsSync(path.join(FRONTEND_DIR, 'index.html'))) {
        return next();
      }
      return res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: `Rota ${req.method} ${req.path} não encontrada.`,
      });
    });
  }

  frontend() {
    if (!fs.existsSync(path.join(FRONTEND_DIR, 'index.html'))) return;
    this.server.use(express.static(FRONTEND_DIR));
    this.server.use((req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
  }

  errorHandler() {
    this.server.use((err, req, res, next) => {
      if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({
          statusCode: 400,
          error: 'Bad Request',
          message: 'JSON inválido no corpo da requisição.',
        });
      }
      if (err?.type === 'entity.too.large') {
        return res.status(413).json({
          statusCode: 413,
          error: 'Payload Too Large',
          message: 'Corpo da requisição maior que o permitido (100 KB).',
        });
      }
      console.error('[erro]', err);
      return res.status(500).json(serializeErrors(err));
    });
  }
}

module.exports = new App().server;
