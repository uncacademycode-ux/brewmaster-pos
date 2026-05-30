import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Clock, ChefHat, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/cart-store";
import { useOrders, useSetOrderStatus } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Brew House" }] }),
  component: OrdersPage,
});

const statusConfig: Record<OrderStatus, { icon: typeof Clock; color: string; next: OrderStatus | null }> = {
  Pending: { icon: Clock, color: "bg-warning/15 text-foreground border-warning/30", next: "Preparing" },
  Preparing: { icon: ChefHat, color: "bg-accent/20 text-foreground border-accent/40", next: "Completed" },
  Completed: { icon: CheckCircle2, color: "bg-success/15 text-foreground border-success/30", next: null },
};

function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const setStatus = useSetOrderStatus();

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.created_at).toDateString() === today);
  }, [orders]);

  const columns: OrderStatus[] = ["Pending", "Preparing", "Completed"];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Order Queue</h1>
        <p className="text-sm text-muted-foreground">
          {todaysOrders.length} orders today
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading orders…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const list = todaysOrders.filter((o) => o.status === col);
            const cfg = statusConfig[col];
            const Icon = cfg.icon;
            return (
              <div key={col} className="flex flex-col rounded-xl border bg-card/50">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h2 className="font-semibold">{col}</h2>
                  </div>
                  <Badge variant="secondary">{list.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 p-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {list.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">No orders</p>
                  )}
                  {list.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      onChange={(s) => setStatus.mutate({ id: o.id, status: s })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onChange }: { order: Order; onChange: (s: OrderStatus) => void }) {
  const cfg = statusConfig[order.status];
  const prev: Record<OrderStatus, OrderStatus | null> = {
    Pending: null, Preparing: "Pending", Completed: "Preparing",
  };
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <ul className="space-y-0.5 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between">
              <span>{it.quantity}× {it.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="font-bold">{formatCurrency(order.total)}</span>
          <Badge className={cfg.color} variant="outline">{order.status}</Badge>
        </div>
        <div className="flex gap-2">
          {prev[order.status] && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onChange(prev[order.status]!)}>
              ← {prev[order.status]}
            </Button>
          )}
          {cfg.next && (
            <Button size="sm" className="flex-1" onClick={() => onChange(cfg.next!)}>
              {cfg.next} →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
