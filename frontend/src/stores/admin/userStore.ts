import { create } from 'zustand';
import api from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type { AdminUser, Role } from '@/types/admin';

interface AdminUserState {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;

  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: Role) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useAdminUserStore = create<AdminUserState>((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  loading: false,

  fetchUsers: async () => {
    const { page, pageSize } = get();
    set({ loading: true });
    try {
      const data = await api.get<PaginatedResponse<AdminUser>>('/users', {
        page,
        pageSize,
      });
      set({
        users: data.items,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateUserRole: async (id: string, role: Role) => {
    await api.put(`/users/${id}/role`, { role });
    get().fetchUsers();
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
    get().fetchUsers();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchUsers();
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchUsers();
  },
}));
