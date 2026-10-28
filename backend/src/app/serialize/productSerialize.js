/**
 * Formato público do produto.
 *
 * `id` em vez de `_id` e nenhum detalhe do Mongo na resposta: quem consome a
 * API não precisa saber qual banco está atrás dela.
 */
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
