const ProductSchema = require('../../app/schema/ProductSchema');
const produtos = require('./produtos');

const comDatas = () => {
  const agora = Date.now();
  return produtos.map((p, i) => {
    const data = new Date(agora - (produtos.length - i) * 60_000);
    return { ...p, createdAt: data, updatedAt: data };
  });
};

async function seed() {
  await ProductSchema.deleteMany({});
  const criados = await ProductSchema.insertMany(comDatas());
  return criados.length;
}

async function seedIfEmpty() {
  if (await ProductSchema.exists({})) return 0;
  const criados = await ProductSchema.insertMany(comDatas());
  console.log(`[seed] Catálogo vazio — ${criados.length} produtos de demonstração criados.`);
  return criados.length;
}

module.exports = { seed, seedIfEmpty };
