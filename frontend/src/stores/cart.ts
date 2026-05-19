import { create } from 'zustand';
import type { CartSummary, CartItem } from '@/types';
import api from '@/lib/api';

interface CartState {
  cart: CartSummary | null;
  isLoading: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (
    productId: string,
    quantity: number,
    selectedSpecs?: Record<string, string>,
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateSelected: (itemId: string, selected: boolean) => Promise<void>;
  selectAll: (selected: boolean) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await api.get<CartSummary>('/cart');
      set({ cart, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (
    productId: string,
    quantity: number,
    selectedSpecs?: Record<string, string>,
  ) => {
    await api.post('/cart', { productId, quantity, selectedSpecs });
    await get().fetchCart();
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    await api.put(`/cart/${itemId}/quantity`, { quantity });
    await get().fetchCart();
  },

  updateSelected: async (itemId: string, selected: boolean) => {
    await api.put(`/cart/${itemId}/selected`, { selected });
    await get().fetchCart();
  },

  selectAll: async (selected: boolean) => {
    await api.put('/cart/select-all', { selected });
    await get().fetchCart();
  },

  removeItem: async (itemId: string) => {
    await api.delete(`/cart/${itemId}`);
    await get().fetchCart();
  },

  clearCart: async () => {
    await api.delete('/cart');
    set({ cart: null });
  },
}));
