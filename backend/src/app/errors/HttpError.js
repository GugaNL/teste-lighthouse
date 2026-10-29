class HttpError extends Error {
  constructor(statusCode, error, message, { details, currentVersion } = {}) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.error = error;
    if (details?.length) this.details = details;
    if (currentVersion !== undefined) this.currentVersion = currentVersion;
  }
}

module.exports = HttpError;
