import { create } from 'zustand';
import api from '@/lib/api';
import type { Order, PaginatedResponse } from '@/types';
import type { OrderStatistics, AdminOrderListItem, OrderStatus } from '@/types/admin';

interface AdminOrderState {
  orders: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  statistics: OrderStatistics | null;
  statisticsLoading: boolean;
  filters: {
    status?: OrderStatus;
    orderNo?: string;
  };

  fetchOrders: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  shipOrder: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<AdminOrderState['filters']>) => void;
}

export const useAdminOrderStore = create<AdminOrderState>((set, get) => ({
  orders: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  loading: false,
  statistics: null,
  statisticsLoading: false,
  filters: {},

  fetchOrders: async () => {
    const { page, pageSize, filters } = get();
    set({ loading: true });
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.orderNo) params.orderNo = filters.orderNo;

      const data = await api.get<PaginatedResponse<AdminOrderListItem>>(
        '/orders/admin/list',
        params
      );
      set({
        orders: data.items,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchStatistics: async () => {
    set({ statisticsLoading: true });
    try {
      const data = await api.get<OrderStatistics>('/orders/admin/statistics');
      set({ statistics: data, statisticsLoading: false });
    } catch (error) {
      set({ statisticsLoading: false });
      throw error;
    }
  },

  shipOrder: async (id: string) => {
    await api.put(`/orders/admin/${id}/ship`, {});
    get().fetchOrders();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchOrders();
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchOrders();
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, page: 1 });
    get().fetchOrders();
  },
}));
