class PreconditionFailed extends Error {
  constructor(message, currentVersion) {
    super(message);
    this.statusCode = 412;
    this.error = 'Precondition Failed';
    this.currentVersion = currentVersion;
  }
}

module.exports = PreconditionFailed;
