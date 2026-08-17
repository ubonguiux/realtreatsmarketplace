import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { StoredImage } from "@/components/marketplace/StoredImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_STATUS_LABELS, formatMoney, titleize } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/vendor/products")({ component: VendorProducts });

const EMPTY = { name: "", description: "", price: "", discount_price: "", stock_quantity: "0", category_id: "", image_url: "", sku: "" };

function VendorProducts() {
  const { vendor } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const products = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    enabled: Boolean(vendor),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        vendor_id: vendor!.id,
        name: form.name,
        description: form.description || null,
        price: Number(form.price || 0),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock_quantity: Number(form.stock_quantity || 0),
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        sku: form.sku || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product created as a draft");
      setForm(EMPTY);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitForReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("submit_product", { _product_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submitted for review");
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create products, then submit them for marketplace review."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">New product</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pname">Name</Label>
                  <Input id="pname" className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="pdesc">Description</Label>
                  <Textarea id="pdesc" className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pprice">Price</Label>
                    <Input id="pprice" inputMode="numeric" className="mt-1.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="pdisc">Discount price</Label>
                    <Input id="pdisc" inputMode="numeric" className="mt-1.5" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pstock">Stock</Label>
                    <Input id="pstock" inputMode="numeric" className="mt-1.5" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="pimg">Image URL</Label>
                  <Input id="pimg" className="mt-1.5" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending || !form.name || !form.price}>
                  {create.isPending ? "Saving…" : "Create product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {products.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : products.data?.length ? (
        <div className="space-y-3">
          {products.data.map((p) => (
            <div key={p.id} className="surface flex flex-wrap items-center gap-4 p-4">
              <div className="h-14 w-14 overflow-hidden rounded-md bg-muted">
                <StoredImage path={p.image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(Number(p.price), p.currency ?? "NGN")} · {p.stock_quantity} in stock
                </p>
              </div>
              <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                {PRODUCT_STATUS_LABELS[p.status] ?? titleize(p.status)}
              </Badge>
              {p.status === "draft" || p.status === "rejected" ? (
                <Button size="sm" variant="outline" onClick={() => submitForReview.mutate(p.id)} disabled={submitForReview.isPending}>
                  Submit for review
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No products yet" description="Create your first product and submit it for review." />
      )}
    </div>
  );
}
