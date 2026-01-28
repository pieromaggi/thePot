import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  const potId = new URL(request.url).searchParams.get("pot_id");

  if (!potId) {
    return NextResponse.json(
      { error: "pot_id is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("participants")
    .select("id,name,created_at")
    .eq("pot_id", potId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participants: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  const body = (await request.json()) as { name?: string; pot_id?: string };
  const name = body.name?.trim();

  if (!name || !body.pot_id) {
    return NextResponse.json(
      { error: "Name and pot_id are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({ name, pot_id: body.pot_id })
    .select("id,name,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participant: data }, { status: 201 });
}
