const HttpError = require('./HttpError');

class RouteNotFound extends HttpError {
  constructor(method, path) {
    super(404, 'Not Found', `Rota ${method} ${path} não encontrada.`);
  }
}

module.exports = RouteNotFound;
