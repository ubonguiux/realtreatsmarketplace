import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,type,read_at,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;
  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread) markRead.mutate();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">{unread}</Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length ? (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="border-b border-border/60 px-3 py-2 last:border-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
