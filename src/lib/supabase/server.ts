import { createClient } from "@supabase/supabase-js";

export const getSupabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL and a Supabase key (service role, publishable, or anon).",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
};
