import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  type: "product" | "service";
  listingId: string;
  title: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity?: number;
  // Service booking fields
  bookingDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  // Product fields
  logisticsPreference?: "PICKUP" | "DELIVERY_SUPPORT";
  deliveryAddress?: string;
};

interface CartState {
  items: CartItem[];
  userId: string | null;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  /** Clears cart if it belonged to a different user; call when user logs in/out */
  ensureUserCart: (userId: string | null) => void;
}

function generateId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      userId: null,
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: generateId() }],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [], userId: null }),
      ensureUserCart: (userId) =>
        set((state) => {
          if (state.userId === userId) return state;
          return { items: [], userId: userId ?? null };
        }),
    }),
    { name: "qvanto-cart", partialize: (s) => ({ items: s.items, userId: s.userId }) }
  )
);
