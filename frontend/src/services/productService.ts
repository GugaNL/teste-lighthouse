import api from './api';
import type {
  CategorySummary,
  Product,
  ProductInput,
  ProductListParams,
  ProductPage,
} from '../types/product';

export interface RequestOptions {
  signal?: AbortSignal;
}

const semVazios = (params: object) =>
  Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
  );

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
