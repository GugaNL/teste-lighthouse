const ProductSchema = require('../../app/schema/ProductSchema');
const { toCents } = require('../../app/rules/product');
const logger = require('../../app/helpers/logger');
const produtos = require('./produtos');

const comDatas = () => {
  const agora = Date.now();
  return produtos.map(({ price, ...produto }, i) => {
    const data = new Date(agora - (produtos.length - i) * 60_000);
    return { ...produto, priceCents: toCents(price), createdAt: data, updatedAt: data };
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
  logger.info(`Catálogo vazio — ${criados.length} produtos de demonstração criados.`);
  return criados.length;
}

module.exports = { seed, seedIfEmpty };
