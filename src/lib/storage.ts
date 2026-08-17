import { supabase } from "@/integrations/supabase/client";

const BUCKET = "marketplace";

export async function uploadImage(file: File, userId: string, folder: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

const cache = new Map<string, string>();

export async function resolveImage(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (cache.has(path)) return cache.get(path)!;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (!data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}
