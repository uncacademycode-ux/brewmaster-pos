import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Printer, X, CreditCard, Loader2, Armchair } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, useCartStore } from "@/lib/cart-store";
import { useCategories, useCheckout, useMenu, useTables } from "@/lib/api";
import { useSettingsStore } from "@/lib/settings-store";
import type { Order } from "@/lib/types";
import { Receipt } from "@/components/receipt";
import { toast } from "sonner";

export default function POSPage() {
  const { data: menu = [], isLoading: menuLoading } = useMenu();
  const { data: categories = [] } = useCategories();
  const { data: tables = [] } = useTables();
  const tablesEnabled = useSettingsStore((s) => s.tablesEnabled);
  const selectedTableId = useSettingsStore((s) => s.selectedTableId);
  const setSelectedTableId = useSettingsStore((s) => s.setSelectedTableId);
  const cart = useCartStore((s) => s.cart);
  const addToCart = useCartStore((s) => s.addToCart);
  const incQty = useCartStore((s) => s.incQty);
  const decQty = useCartStore((s) => s.decQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const checkout = useCheckout();

  const [cat, setCat] = useState<string>("All");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => (cat === "All" ? menu : menu.filter((m) => m.category_name === cat)),
    [menu, cat]
  );

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (tablesEnabled && !selectedTableId) {
      toast.error("Please select a table");
      return;
    }
    try {
      const order = await checkout.mutateAsync({
        cart,
        tableId: tablesEnabled ? selectedTableId : null,
      });
      clearCart();
      setLastOrder(order);
      setOpen(true);
      toast.success("Order placed");
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <section className="flex flex-1 flex-col min-w-0 p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-sm text-muted-foreground">Tap an item to add it to the cart</p>
          </div>
          <Tabs value={cat} onValueChange={setCat}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              {categories.map((c) => (
                <TabsTrigger key={c.id} value={c.name}>{c.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="flex-1">
          {menuLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading menu…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No items in this category. Add some from the Menu page.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 pr-2 pb-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{item.name}</h3>
                      {item.category_name && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">{item.category_name}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </section>

      <aside className="flex w-full flex-col border-t bg-card lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-semibold">Current Order</h2>
            <Badge variant="outline">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <ShoppingBag className="mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map((c) => (
                <Card key={c.itemId} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(c.price)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(c.itemId)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => decQty(c.itemId)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">{c.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => incQty(c.itemId)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="font-semibold">{formatCurrency(c.price * c.quantity)}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="space-y-3 border-t p-4">
          {tablesEnabled && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Armchair className="h-3.5 w-3.5" /> Table
              </label>
              <Select
                value={selectedTableId ?? ""}
                onValueChange={(v) => setSelectedTableId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tables.length ? "Select a table" : "No tables — add some first"} />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} <span className="text-muted-foreground">· {t.seats} seats</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (8%)</span><span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold"
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkout.isPending}
          >
            {checkout.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Charge {formatCurrency(total)}
          </Button>
        </div>
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Confirmed</DialogTitle>
          </DialogHeader>
          {lastOrder && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Order #{lastOrder.id.slice(-8).toUpperCase()}</p>
                <p className="text-2xl font-bold">{formatCurrency(lastOrder.total)}</p>
              </div>
              <div className="space-y-1 text-sm">
                {lastOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.quantity}× {it.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lastOrder && <Receipt order={lastOrder} />}
    </div>
  );
}
