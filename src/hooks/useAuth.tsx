import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Vendor = {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
  rejection_reason: string | null;
};

type Despatcher = {
  id: string;
  full_name: string;
  status: string;
  availability: string;
  rejection_reason: string | null;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  isAdmin: boolean;
  vendor: Vendor | null;
  despatcher: Despatcher | null;
  refresh: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isAdmin: false,
  vendor: null,
  despatcher: null,
  refresh: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const { data } = useQuery({
    queryKey: ["me", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      await supabase.rpc("bootstrap_current_user", {
        _full_name: (session?.user.user_metadata?.["full_name"] as string) ?? "",
      });
      const [{ data: roles }, { data: vendors }, { data: despatchers }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("vendors")
          .select("id,name,slug,status,logo_url,rejection_reason")
          .eq("owner_id", userId!)
          .limit(1),
        supabase
          .from("despatchers")
          .select("id,full_name,status,availability,rejection_reason")
          .eq("user_id", userId!)
          .limit(1),
      ]);
      return {
        roles: (roles ?? []).map((r) => r.role as string),
        vendor: (vendors?.[0] as Vendor | undefined) ?? null,
        despatcher: (despatchers?.[0] as Despatcher | undefined) ?? null,
      };
    },
  });

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      roles: data?.roles ?? [],
      isAdmin: (data?.roles ?? []).includes("super_admin"),
      vendor: data?.vendor ?? null,
      despatcher: data?.despatcher ?? null,
      refresh: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [session, loading, data, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
