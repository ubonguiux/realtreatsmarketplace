import { createHmac, timingSafeEqual } from "crypto";

export type GatewayEvent = {
  reference: string;
  gatewayReference: string | null;
  amount: number;
  gatewayFee: number;
  status: "successful" | "failed";
  eventKey: string;
};

export type GatewayAdapter = {
  id: string;
  secretEnv: string;
  signatureHeader: string;
  /** Returns true when the raw body matches the signature produced with the shared secret. */
  verify: (rawBody: string, signature: string, secret: string) => boolean;
  /** Normalises a provider payload into the internal event shape. */
  parse: (payload: Record<string, unknown>) => GatewayEvent | null;
};

function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a.trim().toLowerCase(), "utf8");
  const bb = Buffer.from(b.trim().toLowerCase(), "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const monnify: GatewayAdapter = {
  id: "monnify",
  secretEnv: "MONNIFY_SECRET_KEY",
  signatureHeader: "monnify-signature",
  verify: (raw, signature, secret) =>
    safeEqualHex(createHmac("sha512", secret).update(raw).digest("hex"), signature),
  parse: (payload) => {
    const data = (payload["eventData"] ?? payload) as Record<string, unknown>;
    const reference = String(data["paymentReference"] ?? "");
    if (!reference) return null;
    const paid = String(payload["eventType"] ?? data["paymentStatus"] ?? "").toUpperCase();
    return {
      reference,
      gatewayReference: (data["transactionReference"] as string) ?? null,
      amount: num(data["amountPaid"] ?? data["amount"]),
      gatewayFee: num(data["totalPayable"] ? 0 : data["fee"]),
      status: paid.includes("PAID") || paid.includes("SUCCESS") ? "successful" : "failed",
      eventKey: String(data["transactionReference"] ?? reference) + ":" + paid,
    };
  },
};

const efgPay: GatewayAdapter = {
  id: "efg_pay",
  secretEnv: "EFG_PAY_SECRET_KEY",
  signatureHeader: "x-efg-signature",
  verify: (raw, signature, secret) =>
    safeEqualHex(createHmac("sha256", secret).update(raw).digest("hex"), signature),
  parse: (payload) => {
    const data = (payload["data"] ?? payload) as Record<string, unknown>;
    const reference = String(data["reference"] ?? data["merchantReference"] ?? "");
    if (!reference) return null;
    const status = String(data["status"] ?? "").toLowerCase();
    return {
      reference,
      gatewayReference: (data["transactionId"] as string) ?? null,
      amount: num(data["amount"]),
      gatewayFee: num(data["fee"]),
      status: status === "successful" || status === "success" || status === "paid" ? "successful" : "failed",
      eventKey: String(data["transactionId"] ?? reference) + ":" + status,
    };
  },
};

export const GATEWAY_ADAPTERS: Record<string, GatewayAdapter> = {
  monnify,
  efg_pay: efgPay,
};