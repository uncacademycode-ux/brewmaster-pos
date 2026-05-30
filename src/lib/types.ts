export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string | null;
  price: number;
  image_url: string;
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Completed";

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  items: OrderItemRow[];
}
