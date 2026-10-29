const HttpError = require('./HttpError');

class NotFound extends HttpError {
  constructor(recurso = 'Recurso') {
    super(404, 'Not Found', `${recurso} não encontrado.`);
  }
}

module.exports = NotFound;
