class BadRequest extends Error {
  constructor(message = 'Requisição inválida.', details) {
    super(message);
    this.statusCode = 400;
    this.error = 'Bad Request';
    this.details = details;
  }
}

module.exports = BadRequest;
