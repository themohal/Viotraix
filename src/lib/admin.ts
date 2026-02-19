import { getServiceSupabase } from "./supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export async function isAdmin(userId: string): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;

  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  return data?.email === ADMIN_EMAIL;
}
