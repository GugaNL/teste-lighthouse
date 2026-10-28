export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  inStock: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Pick<Product, 'name' | 'description' | 'price' | 'stock' | 'category'>;

export type ProductField = keyof ProductInput;

export type ProductSortField = 'createdAt' | 'updatedAt' | 'name' | 'price' | 'stock';
export type ProductSort = ProductSortField | `-${ProductSortField}`;

export interface ProductFilters {
  search?: string;
  category?: string;
  inStock?: boolean;
  sort?: ProductSort;
}

export interface ProductListParams extends ProductFilters {
  page?: number;
  limit?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
}

export interface CategorySummary {
  name: string;
  products: number;
  stock: number;
  inventoryValue: number;
  outOfStock: number;
}
