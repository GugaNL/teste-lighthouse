const HttpError = require('./HttpError');

class PayloadTooLarge extends HttpError {
  constructor(limite) {
    super(413, 'Payload Too Large', `Corpo da requisição maior que o permitido (${limite}).`);
  }
}

module.exports = PayloadTooLarge;
