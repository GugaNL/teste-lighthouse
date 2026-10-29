const HttpError = require('./HttpError');

class TooManyRequests extends HttpError {
  constructor() {
    super(429, 'Too Many Requests', 'Muitas alterações em pouco tempo. Aguarde um instante e tente de novo.');
  }
}

module.exports = TooManyRequests;
