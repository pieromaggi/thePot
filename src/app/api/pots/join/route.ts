import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  const body = (await request.json()) as { invite_code?: string };
  const inviteCode = body.invite_code?.trim();

  if (!inviteCode) {
    return NextResponse.json(
      { error: "Invite code is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("pots")
    .select("id,name,invite_code,created_at")
    .eq("invite_code", inviteCode)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Invalid invite code." },
      { status: 404 },
    );
  }

  return NextResponse.json({ pot: data });
}
