const ProductSchema = require('../../app/schema/ProductSchema');
const produtos = require('./produtos');

/**
 * Datas espaçadas de um em um minuto, do mais antigo ao mais novo: a ordenação
 * padrão ("mais recentes") fica determinística, em vez de todos os produtos
 * empatarem no mesmo milissegundo do insertMany.
 */
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
  // exists() e não estimatedDocumentCount(): a contagem estimada vem dos
  // metadados da coleção, que ficam zerados depois de o mongod ser derrubado
  // sem desligar direito — e o catálogo era semeado em dobro.
  if (await ProductSchema.exists({})) return 0;
  const criados = await ProductSchema.insertMany(comDatas());
  console.log(`[seed] Catálogo vazio — ${criados.length} produtos de demonstração criados.`);
  return criados.length;
}

module.exports = { seed, seedIfEmpty };
