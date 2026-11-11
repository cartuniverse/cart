import { supabase } from "./supabase";
import type { Profile } from "./types";

export async function signIn(email: string, password: string) {
  if (!supabase) return { error: "Supabase no configurado" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    projectName: data.project_name,
  };
}
