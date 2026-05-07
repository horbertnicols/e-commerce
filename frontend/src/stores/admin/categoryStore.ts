import { create } from 'zustand';
import api from '@/lib/api';
import type { Category } from '@/types';
import type { CreateCategoryDto, UpdateCategoryDto } from '@/types/admin';

interface AdminCategoryState {
  categories: Category[];
  categoryTree: Category[];
  loading: boolean;

  fetchCategories: () => Promise<void>;
  fetchCategoryTree: () => Promise<void>;
  createCategory: (data: CreateCategoryDto) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryDto) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useAdminCategoryStore = create<AdminCategoryState>((set, get) => ({
  categories: [],
  categoryTree: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Category[]>('/categories');
      set({ categories: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchCategoryTree: async () => {
    set({ loading: true });
    try {
      const data = await api.get<Category[]>('/categories/tree');
      set({ categoryTree: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createCategory: async (data: CreateCategoryDto) => {
    await api.post('/categories', data);
    get().fetchCategories();
  },

  updateCategory: async (id: string, data: UpdateCategoryDto) => {
    await api.put(`/categories/${id}`, data);
    get().fetchCategories();
  },

  deleteCategory: async (id: string) => {
    await api.delete(`/categories/${id}`);
    get().fetchCategories();
  },
}));
