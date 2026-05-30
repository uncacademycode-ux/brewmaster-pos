import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem, Category, MenuItem, Order, OrderStatus } from "./types";

// ---------- Categories ----------
export const categoriesKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; sort_order?: number }) => {
      const { error } = await supabase.from("categories").insert({
        name: input.name,
        sort_order: input.sort_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; sort_order?: number }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKey });
      qc.invalidateQueries({ queryKey: menuKey });
    },
  });
}

// ---------- Menu items ----------
export const menuKey = ["menu"] as const;

export function useMenu() {
  return useQuery({
    queryKey: menuKey,
    queryFn: async (): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category_id, price, image_url, categories(name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        category_name: row.categories?.name ?? null,
        price: Number(row.price),
        image_url: row.image_url ?? "",
      }));
    },
  });
}

export function useAddMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<MenuItem, "id" | "category_name">) => {
      const { error } = await supabase.from("menu_items").insert({
        name: input.name,
        category_id: input.category_id,
        price: input.price,
        image_url: input.image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKey }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Omit<MenuItem, "id" | "category_name">> }) => {
      const { error } = await supabase.from("menu_items").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKey }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKey }),
  });
}

// ---------- Orders ----------
export const ordersKey = ["orders"] as const;

export function useOrders() {
  return useQuery({
    queryKey: ordersKey,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total, created_at, order_items(id, order_id, menu_item_id, name, price, quantity)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        status: row.status as OrderStatus,
        total: Number(row.total),
        created_at: row.created_at,
        items: (row.order_items ?? []).map((it: any) => ({
          id: it.id,
          order_id: it.order_id,
          menu_item_id: it.menu_item_id,
          name: it.name,
          price: Number(it.price),
          quantity: it.quantity,
        })),
      }));
    },
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cart: CartItem[]): Promise<Order> => {
      if (cart.length === 0) throw new Error("Cart is empty");
      const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .insert({ status: "Pending", total })
        .select("id, status, total, created_at")
        .single();
      if (orderErr || !orderRow) throw orderErr ?? new Error("Failed to create order");

      const itemsPayload = cart.map((c) => ({
        order_id: orderRow.id,
        menu_item_id: c.itemId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
      }));

      const { data: itemsRows, error: itemsErr } = await supabase
        .from("order_items")
        .insert(itemsPayload)
        .select("id, order_id, menu_item_id, name, price, quantity");
      if (itemsErr) throw itemsErr;

      return {
        id: orderRow.id,
        status: orderRow.status as OrderStatus,
        total: Number(orderRow.total),
        created_at: orderRow.created_at,
        items: (itemsRows ?? []).map((it: any) => ({
          id: it.id,
          order_id: it.order_id,
          menu_item_id: it.menu_item_id,
          name: it.name,
          price: Number(it.price),
          quantity: it.quantity,
        })),
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKey }),
  });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: input.status }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKey }),
  });
}
