import { useMemo } from "react";
import { DollarSign, Loader2, ShoppingBag, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/cart-store";
import { useOrders } from "@/lib/api";

export default function AnalyticsPage() {
  const { data: orders = [], isLoading } = useOrders();

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
            ? d.toLocaleDateString(undefined, { weekday: "short" })
            : `${d.getMonth() + 1}/${d.getDate()}`,
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
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Revenue and order insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} />
        <StatCard label="Today's Orders" value={String(stats.todayCount)} icon={ShoppingBag} />
        <StatCard label="Month Revenue" value={formatCurrency(stats.monthRevenue)} icon={TrendingUp} />
        <StatCard
          label="Best Seller Today"
          value={stats.best}
          sub={stats.bestN > 0 ? `${stats.bestN} sold` : "No sales yet"}
          icon={Trophy}
        />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="7">
            <TabsList>
              <TabsTrigger value="7">Last 7 days</TabsTrigger>
              <TabsTrigger value="30">Last 30 days</TabsTrigger>
            </TabsList>
            <TabsContent value="7" className="pt-4"><Chart data={stats.week} /></TabsContent>
            <TabsContent value="30" className="pt-4"><Chart data={stats.month} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>End of Day Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total revenue" value={formatCurrency(stats.todayRevenue)} />
            <Row label="Total orders" value={String(stats.todayCount)} />
            <Row label="Avg order value" value={formatCurrency(stats.todayCount ? stats.todayRevenue / stats.todayCount : 0)} />
            <Row label="Best seller" value={stats.best} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>End of Month Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total revenue" value={formatCurrency(stats.monthRevenue)} />
            <Row label="Total orders" value={String(stats.monthCount)} />
            <Row label="Avg order value" value={formatCurrency(stats.monthCount ? stats.monthRevenue / stats.monthCount : 0)} />
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
            tickFormatter={(v) => `$${v}`} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-popover-foreground)",
              fontSize: 12,
            }}
            formatter={(v: number) => [formatCurrency(v), "Revenue"]}
          />
          <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
