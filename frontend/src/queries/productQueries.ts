import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from '../services/productService';
import type { ProductInput, ProductListParams } from '../types/product';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

function invalidarCatalogo(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
}

export function useProductsQuery(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => listProducts(params, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useProductQuery(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, { signal }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => listCategories({ signal }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: ProductInput) => createProduct(dados),
    onSuccess: (criado) => {
      queryClient.setQueryData(productKeys.detail(criado.id), criado);
      invalidarCatalogo(queryClient);
    },
  });
}

export interface UpdateProductVariables {
  id: string;
  input: ProductInput;
  version?: number;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, version }: UpdateProductVariables) => updateProduct(id, input, version),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(productKeys.detail(atualizado.id), atualizado);
      invalidarCatalogo(queryClient);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSettled: (_resultado, _erro, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      invalidarCatalogo(queryClient);
    },
  });
}
