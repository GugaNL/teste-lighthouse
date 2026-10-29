/**
 * @typedef {{ field: string, message: string }} FieldError
 * @typedef {{ details?: FieldError[], currentVersion?: number }} HttpErrorOptions
 */

class HttpError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} error
   * @param {string} message
   * @param {HttpErrorOptions} [opcoes]
   */
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
