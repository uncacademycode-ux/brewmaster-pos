import { useMemo, useState } from "react";
import { DollarSign, Loader2, ShoppingBag, Trash2, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/cart-store";
import { useDeleteAllOrders, useDeleteOrdersInRange, useOrders } from "@/lib/api";
import { toast } from "sonner";

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

export default function AnalyticsPage() {
  const { data: allOrders = [], isLoading } = useOrders();
  const orders = useMemo(() => allOrders.filter((o) => o.status !== "Cancelled"), [allOrders]);
  const deleteRange = useDeleteOrdersInRange();
  const deleteAll = useDeleteAllOrders();
  const [resetScope, setResetScope] = useState<null | "day" | "month" | "all">(null);

  const handleReset = async () => {
    if (!resetScope) return;
    let n = 0;
    if (resetScope === "all") n = await deleteAll.mutateAsync();
    else n = await deleteRange.mutateAsync(resetScope === "day" ? dayRange() : monthRange());
    toast.success(`${n} commande(s) supprimée(s)`);
    setResetScope(null);
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const today = orders.filter((o) => new Date(o.created_at).toDateString() === todayStr);
    const todayRevenue = today.reduce((s, o) => s + o.total, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
    const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

    const counts = new Map<string, number>();
    today.forEach((o) => o.items.forEach((it) => counts.set(it.name, (counts.get(it.name) ?? 0) + it.quantity)));
    let best = "—"; let bestN = 0;
    counts.forEach((n, name) => { if (n > bestN) { bestN = n; best = name; } });

    const series = (days: number) => {
      const arr: { label: string; revenue: number; orders: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(d.getDate() + 1);
        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at);
          return t >= d && t < next;
        });
        arr.push({
          label: days <= 7
            ? d.toLocaleDateString("fr-FR", { weekday: "short" })
            : `${d.getDate()}/${d.getMonth() + 1}`,
          revenue: Number(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
          orders: dayOrders.length,
        });
      }
      return arr;
    };

    return {
      todayRevenue,
      todayCount: today.length,
      monthRevenue,
      monthCount: monthOrders.length,
      best,
      bestN,
      week: series(7),
      month: series(30),
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement des analyses…
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytique</h1>
        <p className="text-sm text-muted-foreground">Revenus et statistiques des commandes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenu du jour" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} />
        <StatCard label="Commandes du jour" value={String(stats.todayCount)} icon={ShoppingBag} />
        <StatCard label="Revenu du mois" value={formatCurrency(stats.monthRevenue)} icon={TrendingUp} />
        <StatCard
          label="Meilleure vente du jour"
          value={stats.best}
          sub={stats.bestN > 0 ? `${stats.bestN} vendus` : "Aucune vente"}
          icon={Trophy}
        />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Tendance des revenus</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="7">
            <TabsList>
              <TabsTrigger value="7">7 derniers jours</TabsTrigger>
              <TabsTrigger value="30">30 derniers jours</TabsTrigger>
            </TabsList>
            <TabsContent value="7" className="pt-4"><Chart data={stats.week} /></TabsContent>
            <TabsContent value="30" className="pt-4"><Chart data={stats.month} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bilan de la journée</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Revenu total" value={formatCurrency(stats.todayRevenue)} />
            <Row label="Nombre de commandes" value={String(stats.todayCount)} />
            <Row label="Panier moyen" value={formatCurrency(stats.todayCount ? stats.todayRevenue / stats.todayCount : 0)} />
            <Row label="Meilleure vente" value={stats.best} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bilan du mois</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Revenu total" value={formatCurrency(stats.monthRevenue)} />
            <Row label="Nombre de commandes" value={String(stats.monthCount)} />
            <Row label="Panier moyen" value={formatCurrency(stats.monthCount ? stats.monthRevenue / stats.monthCount : 0)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: typeof DollarSign }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Chart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
            tickFormatter={(v) => `${v} MAD`} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-popover-foreground)",
              fontSize: 12,
            }}
            formatter={(v: number) => [formatCurrency(v), "Revenu"]}
          />
          <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
