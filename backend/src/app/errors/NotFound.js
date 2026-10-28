class NotFound extends Error {
  constructor(recurso = 'Recurso') {
    super(`${recurso} não encontrado.`);
    this.statusCode = 404;
    this.error = 'Not Found';
  }
}

module.exports = NotFound;
