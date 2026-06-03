import { useMemo, useState } from "react";
import { Clock, ChefHat, CheckCircle2, Loader2, XCircle, Download, Trash2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/cart-store";
import { useDeleteAllOrders, useDeleteOrder, useDeleteOrdersInRange, useOrders, useSetOrderStatus } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { toast } from "sonner";

const statusLabels: Record<OrderStatus, string> = {
  Pending: "En attente",
  Preparing: "En préparation",
  Completed: "Terminée",
  Cancelled: "Annulée",
};

const statusConfig: Record<OrderStatus, { icon: typeof Clock; color: string; next: OrderStatus | null }> = {
  Pending: { icon: Clock, color: "bg-warning/15 text-foreground border-warning/30", next: "Preparing" },
  Preparing: { icon: ChefHat, color: "bg-accent/20 text-foreground border-accent/40", next: "Completed" },
  Completed: { icon: CheckCircle2, color: "bg-success/15 text-foreground border-success/30", next: null },
  Cancelled: { icon: XCircle, color: "bg-destructive/15 text-foreground border-destructive/30", next: null },
};

const prevStatus: Record<OrderStatus, OrderStatus | null> = {
  Pending: null, Preparing: "Pending", Completed: "Preparing", Cancelled: null,
};

function dayRange() {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(from); to.setDate(from.getDate() + 1);
  return { from, to };
}
function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from, to };
}

function downloadCsv(orders: Order[], filename: string) {
  const rows = [["ID", "Date", "Statut", "Table", "Article", "Quantité", "Prix unitaire", "Sous-total", "Total commande"]];
  orders.forEach((o) => {
    if (o.items.length === 0) {
      rows.push([o.id, new Date(o.created_at).toLocaleString("fr-FR"), o.status, o.table_label ?? "", "", "", "", "", String(o.total)]);
    }
    o.items.forEach((it) => {
      rows.push([
        o.id,
        new Date(o.created_at).toLocaleString("fr-FR"),
        o.status,
        o.table_label ?? "",
        it.name,
        String(it.quantity),
        String(it.price),
        String(it.price * it.quantity),
        String(o.total),
      ]);
    });
  });
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const setStatus = useSetOrderStatus();
  const deleteOrder = useDeleteOrder();
  const deleteRange = useDeleteOrdersInRange();
  const deleteAll = useDeleteAllOrders();
  const [resetScope, setResetScope] = useState<null | "day" | "month" | "all">(null);

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.created_at).toDateString() === today);
  }, [orders]);

  const monthOrders = useMemo(() => {
    const { from, to } = monthRange();
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= from && d < to;
    });
  }, [orders]);

  const columns: OrderStatus[] = ["Pending", "Preparing", "Completed", "Cancelled"];

  const handleReset = async () => {
    if (!resetScope) return;
    let n = 0;
    if (resetScope === "all") {
      n = await deleteAll.mutateAsync();
    } else {
      const range = resetScope === "day" ? dayRange() : monthRange();
      n = await deleteRange.mutateAsync(range);
    }
    toast.success(`${n} commande(s) supprimée(s)`);
    setResetScope(null);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File des commandes</h1>
          <p className="text-sm text-muted-foreground">
            {todaysOrders.length} commandes aujourd'hui · {monthOrders.length} ce mois-ci
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadCsv(todaysOrders, `commandes-jour-${new Date().toISOString().slice(0, 10)}.csv`)}>
            <Download className="mr-1 h-4 w-4" /> Exporter jour
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadCsv(monthOrders, `commandes-mois-${new Date().toISOString().slice(0, 7)}.csv`)}>
            <Download className="mr-1 h-4 w-4" /> Exporter mois
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setResetScope("day")} disabled={todaysOrders.length === 0}>
            <Trash2 className="mr-1 h-4 w-4" /> Réinit. jour
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setResetScope("month")} disabled={monthOrders.length === 0}>
            <Trash2 className="mr-1 h-4 w-4" /> Réinit. mois
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement des commandes…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => {
            const list = todaysOrders.filter((o) => o.status === col);
            const cfg = statusConfig[col];
            const Icon = cfg.icon;
            return (
              <div key={col} className="flex flex-col rounded-xl border bg-card/50">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h2 className="font-semibold">{statusLabels[col]}</h2>
                  </div>
                  <Badge variant="secondary">{list.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 p-3 max-h-[calc(100vh-260px)] overflow-y-auto">
                  {list.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">Aucune commande</p>
                  )}
                  {list.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      onChange={(s) => setStatus.mutate({ id: o.id, status: s })}
                      onCancel={() => setStatus.mutate({ id: o.id, status: "Cancelled" })}
                      onDelete={() => deleteOrder.mutate(o.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={resetScope !== null} onOpenChange={(open) => !open && setResetScope(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser les commandes {resetScope === "day" ? "du jour" : "du mois"} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement {resetScope === "day" ? todaysOrders.length : monthOrders.length} commande(s)
              {" "}et leurs articles. Pensez à exporter avant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrderCard({
  order, onChange, onCancel, onDelete,
}: {
  order: Order;
  onChange: (s: OrderStatus) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const cfg = statusConfig[order.status];
  const prev = prevStatus[order.status];
  const canCancel = order.status !== "Cancelled" && order.status !== "Completed";
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {order.table_label && (
          <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
            🪑 {order.table_label}
          </Badge>
        )}
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
          <Badge className={cfg.color} variant="outline">{statusLabels[order.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {prev && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onChange(prev)}>
              ← {statusLabels[prev]}
            </Button>
          )}
          {cfg.next && (
            <Button size="sm" className="flex-1" onClick={() => onChange(cfg.next!)}>
              {statusLabels[cfg.next]} →
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {canCancel && (
            <Button size="sm" variant="ghost" className="flex-1 text-destructive hover:text-destructive" onClick={onCancel}>
              <XCircle className="mr-1 h-3 w-3" /> Annuler
            </Button>
          )}
          {order.status === "Cancelled" && (
            <Button size="sm" variant="ghost" className="flex-1 text-foreground" onClick={() => onChange("Pending")}>
              <RotateCcw className="mr-1 h-3 w-3" /> Restaurer
            </Button>
          )}
          <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3" /> Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
