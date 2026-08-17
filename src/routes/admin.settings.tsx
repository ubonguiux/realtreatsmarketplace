import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", tagline: "", announcement: "", support_email: "", default_currency: "NGN", dispatch_mode: "manual" });

  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_settings").select("*").maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    const s = settings.data;
    if (s)
      setForm({
        name: s.name ?? "",
        tagline: s.tagline ?? "",
        announcement: s.announcement ?? "",
        support_email: s.support_email ?? "",
        default_currency: s.default_currency ?? "NGN",
        dispatch_mode: s.dispatch_mode ?? "manual",
      });
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketplace_settings").update(form).eq("id", settings.data!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marketplace settings saved");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (settings.isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <PageHeader title="Marketplace settings" description="Branding, announcements and dispatch configuration." />
      <div className="surface max-w-2xl space-y-4 p-5">
        <div>
          <Label htmlFor="mname">Marketplace name</Label>
          <Input id="mname" className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="mtag">Tagline</Label>
          <Input id="mtag" className="mt-1.5" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="mann">Announcement banner</Label>
          <Textarea id="mann" className="mt-1.5" value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="msup">Support email</Label>
            <Input id="msup" className="mt-1.5" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
          </div>
          <div>
            <Label>Dispatch mode</Label>
            <Select value={form.dispatch_mode} onValueChange={(v) => setForm({ ...form, dispatch_mode: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (vendor arranges)</SelectItem>
                <SelectItem value="internal">Internal dispatch team</SelectItem>
                <SelectItem value="third_party">Third-party provider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
