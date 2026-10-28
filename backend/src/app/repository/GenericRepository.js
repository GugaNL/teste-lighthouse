class Repository {
  constructor(schema) {
    this.schema = schema;
  }

  async create(payload) {
    return this.schema.create(payload);
  }

  async getAll(payloadFind = {}) {
    return this.schema.find(payloadFind);
  }

  async getById(id) {
    return this.schema.findById(id);
  }

  async update(id, payload) {
    return this.schema.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  }

  async remove(id) {
    return this.schema.findByIdAndDelete(id);
  }
}

module.exports = Repository;
