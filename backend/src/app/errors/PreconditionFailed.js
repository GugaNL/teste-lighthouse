/**
 * 412 — o cliente pediu para gravar sobre uma versão que já não é a atual.
 *
 * Leva a versão vigente para o frontend poder oferecer "recarregar" ou
 * "salvar mesmo assim" sem precisar de outra requisição para descobri-la.
 */
class PreconditionFailed extends Error {
  constructor(message, currentVersion) {
    super(message);
    this.statusCode = 412;
    this.error = 'Precondition Failed';
    this.currentVersion = currentVersion;
  }
}

module.exports = PreconditionFailed;
