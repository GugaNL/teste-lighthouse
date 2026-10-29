class Repository {
  constructor(schema) {
    this.schema = schema;
  }

  async create(payload) {
    const criado = await this.schema.create(payload);
    return criado.toObject();
  }
}

module.exports = Repository;
