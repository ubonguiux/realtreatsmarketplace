import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY_ADAPTERS } from "@/lib/payments.server";

export const Route = createFileRoute("/api/public/payments/webhook/$gateway")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const adapter = GATEWAY_ADAPTERS[params.gateway];
        if (!adapter) return new Response("Unknown gateway", { status: 404 });

        const secret = process.env[adapter.secretEnv];
        if (!secret) {
          // Adapter exists but the gateway has not been activated with live credentials yet.
          return new Response("Gateway not configured", { status: 503 });
        }

        const raw = await request.text();
        const signature = request.headers.get(adapter.signatureHeader) ?? "";
        if (!signature || !adapter.verify(raw, signature, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const event = adapter.parse(payload);
        if (!event) return new Response("Unrecognised event", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Record the raw event first so replays are traceable and idempotent.
        const { error: eventError } = await supabaseAdmin.from("payment_events").insert({
          gateway: adapter.id,
          event_key: event.eventKey,
          payload: payload as never,
        });
        if (eventError && eventError.code === "23505") {
          return new Response("Already processed", { status: 200 });
        }

        if (event.status === "successful") {
          const { error } = await supabaseAdmin.rpc("confirm_payment", {
            _reference: event.reference,
            _gateway_reference: event.gatewayReference ?? event.reference,
            _paid_amount: event.amount,
            _gateway_fee: event.gatewayFee,
            _payload: payload as never,
          });
          if (error) return new Response(error.message, { status: 400 });
        } else {
          const { error } = await supabaseAdmin.rpc("fail_payment", {
            _reference: event.reference,
            _reason: "Gateway reported a failed transaction",
          });
          if (error) return new Response(error.message, { status: 400 });
        }

        return new Response("ok");
      },
    },
  },
});