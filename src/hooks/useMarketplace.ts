import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { effectivePrice } from "@/lib/marketplace";

export function useSettings() {
  return useQuery({
    queryKey: ["marketplace-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

export function useBranding() {
  return useQuery({
    queryKey: ["marketplace-branding"],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_branding").select("*").maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cart = useQuery({
    queryKey: ["cart", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      let { data: existing } = await supabase.from("carts").select("id").eq("user_id", user!.id).maybeSingle();
      if (!existing) {
        const { data: created, error } = await supabase
          .from("carts")
          .insert({ user_id: user!.id })
          .select("id")
          .single();
        if (error) throw error;
        existing = created;
      }
      const { data: items } = await supabase
        .from("cart_items")
        .select("*, products(name,image_url,stock_quantity,currency), vendors(name,slug)")
        .eq("cart_id", existing!.id)
        .order("created_at");
      return { cartId: existing!.id, items: items ?? [] };
    },
  });

  const addItem = useMutation({
    mutationFn: async (product: {
      id: string;
      vendor_id: string;
      price: number;
      discount_price?: number | null;
      quantity?: number;
    }) => {
      if (!user) throw new Error("Please sign in to add items to your cart");
      const cartId = cart.data?.cartId ?? (await ensureCart(user.id));
      const existing = cart.data?.items.find((i) => i.product_id === product.id);
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + (product.quantity ?? 1) })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: product.id,
        vendor_id: product.vendor_id,
        quantity: product.quantity ?? 1,
        unit_price: effectivePrice(product),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = cart.data?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { ...cart, items, subtotal, count, addItem, updateItem };
}

async function ensureCart(userId: string) {
  const { data } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return created.id;
}

export function useUserLocation() {
  return useQuery({
    queryKey: ["user-location"],
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 8000 },
        );
      }),
  });
}
