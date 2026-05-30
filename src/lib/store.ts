import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MenuItem, Order, OrderStatus } from "./types";
import { generateMockOrders, initialMenu } from "./mock-data";

interface AppState {
  menu: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  // menu
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  // cart
  addToCart: (item: MenuItem) => void;
  incQty: (itemId: string) => void;
  decQty: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  // orders
  checkout: () => Order | null;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      menu: initialMenu,
      cart: [],
      orders: generateMockOrders(),

      addMenuItem: (item) =>
        set((s) => ({ menu: [...s.menu, { ...item, id: uid() }] })),
      updateMenuItem: (id, patch) =>
        set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMenuItem: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

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

      checkout: () => {
        const { cart } = get();
        if (cart.length === 0) return null;
        const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
        const order: Order = {
          id: `o_${Date.now()}_${uid()}`,
          items: cart,
          total,
          status: "Pending",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [order, ...s.orders], cart: [] }));
        return order;
      },

      setOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),
    }),
    {
      name: "coffee-pos-store",
      partialize: (s) => ({ menu: s.menu, orders: s.orders }),
    }
  )
);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
