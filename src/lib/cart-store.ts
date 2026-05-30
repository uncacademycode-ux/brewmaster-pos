import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MenuItem } from "./types";

interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  incQty: (itemId: string) => void;
  decQty: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item) =>
        set((s) => {
          const existing = s.cart.find((c) => c.itemId === item.id);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
              ),
            };
          }
          return {
            cart: [...s.cart, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }],
          };
        }),
      incQty: (itemId) =>
        set((s) => ({
          cart: s.cart.map((c) => (c.itemId === itemId ? { ...c, quantity: c.quantity + 1 } : c)),
        })),
      decQty: (itemId) =>
        set((s) => ({
          cart: s.cart
            .map((c) => (c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c))
            .filter((c) => c.quantity > 0),
        })),
      removeFromCart: (itemId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.itemId !== itemId) })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "coffee-pos-cart" }
  )
);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
