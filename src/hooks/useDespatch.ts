import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const DELIVERY_OPEN_STATUSES = [
  "assigned",
  "accepted",
  "heading_to_pickup",
  "arrived_at_pickup",
  "picked_up",
  "in_transit",
  "near_destination",
  "arrived_at_destination",
] as const;

export const DELIVERY_ACTIVE_STATUSES = DELIVERY_OPEN_STATUSES.filter((s) => s !== "assigned");

export const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  accepted: [{ value: "heading_to_pickup", label: "Head to pickup" }],
  heading_to_pickup: [{ value: "arrived_at_pickup", label: "Arrived at pickup" }],
  arrived_at_pickup: [{ value: "picked_up", label: "Confirm pickup" }],
  picked_up: [{ value: "in_transit", label: "Start delivery" }],
  in_transit: [
    { value: "near_destination", label: "Near destination" },
    { value: "delivered", label: "Confirm delivery" },
  ],
  near_destination: [
    { value: "arrived_at_destination", label: "Arrived at destination" },
    { value: "delivered", label: "Confirm delivery" },
  ],
  arrived_at_destination: [{ value: "delivered", label: "Confirm delivery" }],
};

const DELIVERY_SELECT =
  "id,status,fee,distance_km,pickup_address,pickup_latitude,pickup_longitude,delivery_address,delivery_latitude,delivery_longitude,delivery_instructions,despatcher_id,assigned_at,accepted_at,picked_up_at,delivered_at,failure_reason,created_at,order_id,vendor_order_id,vendor_id,vendors(name,phone,address,city,state)";

/** Realtime refresh for delivery-related screens. */
export function useDeliveryRealtime(keys: string[]) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`deliveries-${keys.join("-")}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, keys.join("-")]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useDespatcherDeliveries() {
  const { despatcher } = useAuth();
  useDeliveryRealtime(["despatch-deliveries", "despatch-available"]);

  const mine = useQuery({
    queryKey: ["despatch-deliveries", despatcher?.id],
    enabled: Boolean(despatcher),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(DELIVERY_SELECT)
        .eq("despatcher_id", despatcher!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const available = useQuery({
    queryKey: ["despatch-available", despatcher?.id],
    enabled: despatcher?.status === "approved",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(DELIVERY_SELECT)
        .eq("status", "awaiting_assignment")
        .is("despatcher_id", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return { mine, available };
}

export function useDespatchActions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["despatch-deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["despatch-available"] });
    queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };
  const wrap = <T,>(fn: (input: T) => Promise<void>, success: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(success);
        invalidate();
      },
      onError: (e: Error) => toast.error(e.message),
    });

  const claim = wrap<string>(async (id) => {
    const { error } = await supabase.rpc("claim_delivery", { _delivery_id: id });
    if (error) throw error;
  }, "Delivery claimed");

  const accept = wrap<string>(async (id) => {
    const { error } = await supabase.rpc("accept_delivery", { _delivery_id: id });
    if (error) throw error;
  }, "Delivery accepted");

  const reject = wrap<string>(async (id) => {
    const { error } = await supabase.rpc("reject_delivery", { _delivery_id: id });
    if (error) throw error;
  }, "Delivery declined");

  const advance = wrap<{ id: string; status: string; note?: string }>(async ({ id, status, note }) => {
    const { error } = await supabase.rpc("update_delivery_status", {
      _delivery_id: id,
      _status: status as never,
      ...(note ? { _note: note } : {}),
    });
    if (error) throw error;
  }, "Delivery updated");

  const setAvailability = wrap<string>(async (availability) => {
    const { error } = await supabase.rpc("set_despatcher_availability", { _availability: availability as never });
    if (error) throw error;
  }, "Availability updated");

  return { claim, accept, reject, advance, setAvailability };
}

export async function pushDespatcherLocation(lat: number, lng: number) {
  const { error } = await supabase.rpc("update_despatcher_location", { _lat: lat, _lng: lng });
  if (error) throw error;
}
