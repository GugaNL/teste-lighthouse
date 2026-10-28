import api from './api';
import type {
  CategorySummary,
  Product,
  ProductInput,
  ProductListParams,
  ProductPage,
} from '../types/product';

/**
 * Chamadas do recurso de produtos — o único lugar do frontend que conhece as
 * rotas da API. Páginas e hooks importam estas funções, nunca o axios.
 */

export interface RequestOptions {
  signal?: AbortSignal;
}

/** Remove filtros vazios para a URL da requisição ficar limpa. */
const semVazios = (params: object) =>
  Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
  );

/**
 * Lista produtos. Devolve os itens da página e o total (cabeçalho
 * X-Total-Count), que é o que a paginação precisa.
 */
export async function listProducts(
  params: ProductListParams = {},
  { signal }: RequestOptions = {}
): Promise<ProductPage> {
  const resposta = await api.get<Product[]>('/products', { params: semVazios(params), signal });
  const total = Number(resposta.headers['x-total-count']);
  return { items: resposta.data, total: Number.isFinite(total) ? total : resposta.data.length };
}

export async function getProduct(id: string, { signal }: RequestOptions = {}): Promise<Product> {
  const resposta = await api.get<Product>(`/products/${id}`, { signal });
  return resposta.data;
}

export async function createProduct(dados: ProductInput): Promise<Product> {
  const resposta = await api.post<Product>('/products', dados);
  return resposta.data;
}

/**
 * Atualiza um produto. Com `version`, envia If-Match: se outra pessoa gravou
 * desde que o formulário foi aberto, a API responde 412 em vez de sobrescrever.
 */
export async function updateProduct(id: string, dados: ProductInput, version?: number): Promise<Product> {
  const headers = version !== undefined ? { 'If-Match': `"${version}"` } : {};
  const resposta = await api.put<Product>(`/products/${id}`, dados, { headers });
  return resposta.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function listCategories({ signal }: RequestOptions = {}): Promise<CategorySummary[]> {
  const resposta = await api.get<CategorySummary[]>('/categories', { signal });
  return resposta.data;
}
