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

export type StockStatusFilter = 'out' | 'low' | 'ok';

export interface ProductFilters {
  search?: string;
  category?: string;
  stockStatus?: StockStatusFilter;
  minPrice?: number;
  maxPrice?: number;
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
  lowStock: number;
}

export interface BatchDeleteResult {
  deleted: number;
}

export interface BatchRestoreResult {
  restored: number;
}

export interface BatchCategoryResult {
  updated: number;
  category: string;
}
