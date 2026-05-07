import { create } from 'zustand';
import api from '@/lib/api';
import type { Product, PaginatedResponse, Category } from '@/types';
import type { CreateProductDto, UpdateProductDto, ProductStatus } from '@/types/admin';

interface AdminProductState {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  selectedIds: string[];
  filters: {
    keyword?: string;
    categoryId?: string;
    status?: ProductStatus;
  };
  categories: Category[];

  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  getProduct: (id: string) => Promise<Product>;
  createProduct: (data: CreateProductDto) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductDto) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  batchPublish: (ids: string[]) => Promise<void>;
  batchOffline: (ids: string[]) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<AdminProductState['filters']>) => void;
  setSelectedIds: (ids: string[]) => void;
}

export const useAdminProductStore = create<AdminProductState>((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  loading: false,
  selectedIds: [],
  filters: {},
  categories: [],

  fetchProducts: async () => {
    const { page, pageSize, filters } = get();
    set({ loading: true });
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.status) params.status = filters.status;

      const data = await api.get<PaginatedResponse<Product>>(
        '/products/admin/list',
        params
      );
      set({
        products: data.items,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
        selectedIds: [],
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      set({ categories: data });
    } catch (error) {
      throw error;
    }
  },

  getProduct: async (id: string) => {
    const data = await api.get<Product>(`/products/admin/${id}`);
    return data;
  },

  createProduct: async (data: CreateProductDto) => {
    await api.post('/products', data);
  },

  updateProduct: async (id: string, data: UpdateProductDto) => {
    await api.put(`/products/${id}`, data);
  },

  deleteProduct: async (id: string) => {
    await api.delete(`/products/${id}`);
    get().fetchProducts();
  },

  updateProductStatus: async (id: string, status: ProductStatus) => {
    await api.put(`/products/${id}/status`, { status });
    get().fetchProducts();
  },

  batchPublish: async (ids: string[]) => {
    await api.post('/products/batch/publish', { ids });
    get().fetchProducts();
  },

  batchOffline: async (ids: string[]) => {
    await api.post('/products/batch/offline', { ids });
    get().fetchProducts();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchProducts();
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchProducts();
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, page: 1 });
    get().fetchProducts();
  },

  setSelectedIds: (ids: string[]) => {
    set({ selectedIds: ids });
  },
}));
