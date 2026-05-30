export type Category = "Hot" | "Cold" | "Pastries";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Completed";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO
}
