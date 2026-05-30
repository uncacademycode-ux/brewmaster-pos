import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, useAppStore } from "@/lib/store";
import type { Category, MenuItem } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "Menu — Brew House" }] }),
  component: MenuPage,
});

const empty = { name: "", category: "Hot" as Category, price: 0, image: "" };

function MenuPage() {
  const menu = useAppStore((s) => s.menu);
  const addMenuItem = useAppStore((s) => s.addMenuItem);
  const updateMenuItem = useAppStore((s) => s.updateMenuItem);
  const deleteMenuItem = useAppStore((s) => s.deleteMenuItem);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(empty);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m: MenuItem) => {
    setEditing(m);
    setForm({ name: m.name, category: m.category, price: m.price, image: m.image });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Name and a valid price are required");
      return;
    }
    if (editing) {
      updateMenuItem(editing.id, form);
      toast.success("Item updated");
    } else {
      addMenuItem(form);
      toast.success("Item added");
    }
    setOpen(false);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground">{menu.length} items in catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Add item
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <img src={m.image} alt={m.name} className="h-10 w-10 rounded-md object-cover" />
                </TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(m.price)}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { deleteMenuItem(m.id); toast.success("Item deleted"); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "New menu item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    <SelectItem value="Pastries">Pastries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" step="0.25" min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
