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
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

function generateId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
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
      clearCart: () => set({ items: [] }),
    }),
    { name: "nexus-cart" }
  )
);
