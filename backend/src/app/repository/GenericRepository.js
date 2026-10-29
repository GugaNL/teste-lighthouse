class Repository {
  constructor(schema) {
    this.schema = schema;
  }

  async create(payload) {
    return this.schema.create(payload);
  }
}

module.exports = Repository;
