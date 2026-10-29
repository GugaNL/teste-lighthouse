const serialize = (doc) => {
  if (!doc) return doc;
  const p = doc.toObject ? doc.toObject() : doc;

  return {
    id: String(p._id),
    name: p.name,
    description: p.description || '',
    price: p.price,
    stock: p.stock,
    category: p.category,
    inStock: p.stock > 0,
    version: p.version,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

module.exports = { serialize };
