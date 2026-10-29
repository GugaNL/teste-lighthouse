const HttpError = require('./HttpError');

class PreconditionFailed extends HttpError {
  constructor(message, currentVersion) {
    super(412, 'Precondition Failed', message, { currentVersion });
  }
}

module.exports = PreconditionFailed;
