import api from './api';

/**
 * Chamadas do recurso de produtos — o único lugar do frontend que conhece as
 * rotas da API. Páginas e hooks importam estas funções, nunca o axios.
 */

/** Remove filtros vazios para a URL da requisição ficar limpa. */
const semVazios = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
  );

/**
 * Lista produtos. Devolve os itens da página e o total (cabeçalho
 * X-Total-Count), que é o que a paginação precisa.
 */
export async function listProducts(params = {}, { signal } = {}) {
  const resposta = await api.get('/products', { params: semVazios(params), signal });
  const total = Number(resposta.headers['x-total-count']);
  return { items: resposta.data, total: Number.isFinite(total) ? total : resposta.data.length };
}

export async function getProduct(id, { signal } = {}) {
  const resposta = await api.get(`/products/${id}`, { signal });
  return resposta.data;
}

export async function createProduct(dados) {
  const resposta = await api.post('/products', dados);
  return resposta.data;
}

/**
 * Atualiza um produto. Com `version`, envia If-Match: se outra pessoa gravou
 * desde que o formulário foi aberto, a API responde 412 em vez de sobrescrever.
 */
export async function updateProduct(id, dados, version) {
  const headers = version !== undefined ? { 'If-Match': `"${version}"` } : {};
  const resposta = await api.put(`/products/${id}`, dados, { headers });
  return resposta.data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}

export async function listCategories({ signal } = {}) {
  const resposta = await api.get('/categories', { signal });
  return resposta.data;
}
