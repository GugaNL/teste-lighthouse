const serialize = (produto) => {
  if (!produto) return produto;

  return {
    id: String(produto._id),
    name: produto.name,
    description: produto.description || '',
    price: produto.price,
    stock: produto.stock,
    category: produto.category,
    inStock: produto.stock > 0,
    version: produto.version,
    createdAt: produto.createdAt,
    updatedAt: produto.updatedAt,
  };
};

module.exports = { serialize };
