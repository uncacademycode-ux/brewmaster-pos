import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/cart-store";
import {
  useAddCategory, useAddMenuItem, useCategories, useDeleteCategory,
  useDeleteMenuItem, useMenu, useUpdateCategory, useUpdateMenuItem,
} from "@/lib/api";
import type { Category, MenuItem } from "@/lib/types";
import { toast } from "sonner";

export default function MenuPage() {
  const { data: menu = [], isLoading: menuLoading } = useMenu();
  const { data: categories = [], isLoading: catLoading } = useCategories();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
        <p className="text-sm text-muted-foreground">
          {menu.length} items in {categories.length} categories
        </p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <ItemsPanel menu={menu} categories={categories} loading={menuLoading} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesPanel categories={categories} menu={menu} loading={catLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Items ----------
const emptyItem = { name: "", category_id: null as string | null, price: 0, image_url: "" };

function ItemsPanel({
  menu, categories, loading,
}: { menu: MenuItem[]; categories: Category[]; loading: boolean }) {
  const addItem = useAddMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyItem);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyItem, category_id: categories[0]?.id ?? null });
    setOpen(true);
  };
  const openEdit = (m: MenuItem) => {
    setEditing(m);
    setForm({ name: m.name, category_id: m.category_id, price: m.price, image_url: m.image_url });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Name and a valid price are required");
      return;
    }
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, patch: form });
        toast.success("Item updated");
      } else {
        await addItem.mutateAsync(form);
        toast.success("Item added");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Item deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Catalog</CardTitle>
        <Button onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />Add item
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : menu.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No items yet. {categories.length === 0 && "Create a category first."}
          </p>
        ) : (
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
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    {m.category_name ? <Badge variant="secondary">{m.category_name}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(m.price)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

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
                <Select
                  value={form.category_id ?? undefined}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
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
              <Input id="image" value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={addItem.isPending || updateItem.isPending}>
              {editing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------- Categories ----------
function CategoriesPanel({
  categories, menu, loading,
}: { categories: Category[]; menu: MenuItem[]; loading: boolean }) {
  const addCat = useAddCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSortOrder(categories.length + 1);
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setSortOrder(c.sort_order);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, name, sort_order: sortOrder });
        toast.success("Category updated");
      } else {
        await addCat.mutateAsync({ name, sort_order: sortOrder });
        toast.success("Category added");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCat.mutateAsync(confirmDelete.id);
      toast.success("Category deleted");
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const itemCount = (id: string) => menu.filter((m) => m.category_id === id).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Categories</CardTitle>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add category</Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : categories.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{c.sort_order}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{itemCount(c.id)}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cname">Name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smoothies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csort">Sort order</Label>
              <Input id="csort" type="number" value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
              <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={addCat.isPending || updateCat.isPending}>
              {editing ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && itemCount(confirmDelete.id) > 0
                ? `${itemCount(confirmDelete.id)} menu item(s) will remain but become uncategorized.`
                : "This category has no items."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
