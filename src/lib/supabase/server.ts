import { createClient } from "@supabase/supabase-js";

export const getSupabaseServer = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey ?? publishableKey ?? anonKey;

  if (!supabaseUrl || !key) {
    throw new Error(
      "Missing SUPABASE_URL and a Supabase key (service role, publishable, or anon).",
    );
  }

  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
};
