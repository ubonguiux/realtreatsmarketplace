export type GatewayId = "monnify" | "efg_pay" | "manual";

export const GATEWAYS: { id: GatewayId; label: string; description: string }[] = [
  { id: "monnify", label: "Monnify", description: "Card, bank transfer and USSD via Monnify." },
  { id: "efg_pay", label: "EFG Pay", description: "Card and bank transfer via EFG Pay." },
  { id: "manual", label: "Bank transfer (manual)", description: "Pay by transfer; RealTreats confirms it manually." },
];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  initiated: "Initiated",
  pending: "Pending",
  successful: "Successful",
  failed: "Failed",
  abandoned: "Abandoned",
  partially_refunded: "Partially refunded",
  fully_refunded: "Refunded",
  reversed: "Reversed",
};

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  window: "Settlement window",
  ready_for_approval: "Ready for approval",
  approved: "Approved",
  processing: "Processing",
  paid: "Paid",
  held: "Held",
  rejected: "Rejected",
  failed: "Failed",
};

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  successful: "Successful",
  failed: "Failed",
  retry_required: "Retry required",
  cancelled: "Cancelled",
};

export function statusTone(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["successful", "paid", "approved", "delivered", "completed"].includes(status)) return "default";
  if (["failed", "rejected", "cancelled", "reversed", "retry_required"].includes(status)) return "destructive";
  if (["held", "abandoned"].includes(status)) return "outline";
  return "secondary";
}