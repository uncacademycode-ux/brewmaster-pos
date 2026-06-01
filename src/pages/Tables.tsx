import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Armchair, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAddTable, useDeleteTable, useOrders, useTables, useUpdateTable } from "@/lib/api";
import { useSettingsStore } from "@/lib/settings-store";
import type { CafeTable } from "@/lib/types";
import { toast } from "sonner";

export default function TablesPage() {
  const { data: tables = [], isLoading } = useTables();
  const { data: orders = [] } = useOrders();
  const addTable = useAddTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const tablesEnabled = useSettingsStore((s) => s.tablesEnabled);
  const setTablesEnabled = useSettingsStore((s) => s.setTablesEnabled);

  const [editing, setEditing] = useState<CafeTable | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CafeTable | null>(null);
  const [form, setForm] = useState({ label: "", seats: 2, sort_order: 0 });

  const openCreate = () => {
    setEditing(null);
    setForm({ label: "", seats: 2, sort_order: tables.length });
    setOpen(true);
  };
  const openEdit = (t: CafeTable) => {
    setEditing(t);
    setForm({ label: t.label, seats: t.seats, sort_order: t.sort_order });
    setOpen(true);
  };

  const save = async () => {
    if (!form.label.trim()) return toast.error("Label is required");
    try {
      if (editing) {
        await updateTable.mutateAsync({ id: editing.id, ...form });
        toast.success("Table updated");
      } else {
        await addTable.mutateAsync(form);
        toast.success("Table added");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const activeOrdersByTable = (id: string) =>
    orders.filter((o) => o.table_id === id && o.status !== "Completed");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Table Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage tables and assign orders to them
          </p>
        </div>
        <Button onClick={openCreate} disabled={!tablesEnabled}>
          <Plus className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className="h-4 w-4" /> Table Management Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground max-w-lg">
            When enabled, every order is linked to a table. Turn it off to run
            orders-only mode (takeaway / counter) without table selection.
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="tables-toggle" className="text-sm font-medium">
              {tablesEnabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="tables-toggle"
              checked={tablesEnabled}
              onCheckedChange={setTablesEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {!tablesEnabled && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Table management is currently off. New orders will be created
            without a table.
          </CardContent>
        </Card>
      )}

      {tablesEnabled && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading tables…
            </div>
          ) : tables.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No tables yet. Add your first table to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((t) => {
                const active = activeOrdersByTable(t.id);
                const subtotal = active.reduce((s, o) => s + o.total, 0);
                return (
                  <Card key={t.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Armchair className="h-4 w-4" /> {t.label}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {t.seats} seats
                          </p>
                        </div>
                        <Badge variant={active.length ? "default" : "secondary"}>
                          {active.length ? "Occupied" : "Free"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {active.length > 0 ? (
                        <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs">
                          <div className="flex justify-between font-medium">
                            <span>{active.length} active order{active.length > 1 ? "s" : ""}</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          {active.slice(0, 3).map((o) => (
                            <div key={o.id} className="flex justify-between text-muted-foreground">
                              <span>#{o.id.slice(-6).toUpperCase()}</span>
                              <span>{o.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No active orders</p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(t)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelete(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Table" : "Add Table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Table 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="sort">Order</Label>
                <Input
                  id="sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={addTable.isPending || updateTable.isPending}>
              {(addTable.isPending || updateTable.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this table?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.label}" will be removed. Existing orders will keep
              their history but lose the table link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteTable.mutateAsync(confirmDelete.id);
                  toast.success("Table deleted");
                } catch (e: any) {
                  toast.error(e.message ?? "Failed");
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
