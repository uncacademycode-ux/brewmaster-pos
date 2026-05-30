import type { MenuItem, Order } from "./types";

export const initialMenu: MenuItem[] = [
  { id: "m1", name: "Espresso", category: "Hot", price: 3.0, image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400" },
  { id: "m2", name: "Cappuccino", category: "Hot", price: 4.5, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" },
  { id: "m3", name: "Latte", category: "Hot", price: 4.75, image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400" },
  { id: "m4", name: "Mocha", category: "Hot", price: 5.0, image: "https://images.unsplash.com/photo-1578374173703-cfe48ae27e84?w=400" },
  { id: "m5", name: "Americano", category: "Hot", price: 3.5, image: "https://images.unsplash.com/photo-1521302200778-33500795e128?w=400" },
  { id: "m6", name: "Iced Coffee", category: "Cold", price: 4.0, image: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=400" },
  { id: "m7", name: "Cold Brew", category: "Cold", price: 4.75, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
  { id: "m8", name: "Iced Latte", category: "Cold", price: 5.0, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
  { id: "m9", name: "Frappé", category: "Cold", price: 5.5, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
  { id: "m10", name: "Croissant", category: "Pastries", price: 3.25, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400" },
  { id: "m11", name: "Blueberry Muffin", category: "Pastries", price: 3.0, image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400" },
  { id: "m12", name: "Cinnamon Roll", category: "Pastries", price: 3.75, image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400" },
];

// Generate ~60 days of mock orders for analytics
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockOrders(): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  for (let d = 0; d < 60; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const count = rand(8, 22);
    for (let i = 0; i < count; i++) {
      const items = Array.from({ length: rand(1, 4) }).map(() => {
        const m = initialMenu[rand(0, initialMenu.length - 1)];
        const qty = rand(1, 3);
        return { itemId: m.id, name: m.name, price: m.price, quantity: qty };
      });
      const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const hh = rand(7, 19);
      const mm = rand(0, 59);
      const dt = new Date(day);
      dt.setHours(hh, mm, 0, 0);
      orders.push({
        id: `o_${d}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        items,
        total,
        status: d === 0 && i >= count - 3 ? (i % 2 === 0 ? "Pending" : "Preparing") : "Completed",
        createdAt: dt.toISOString(),
      });
    }
  }
  return orders;
}
