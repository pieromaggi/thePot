import { NextResponse } from "next/server";
import crypto from "crypto";

import { getSupabaseServer } from "@/lib/supabase/server";

const INVITE_LENGTH = 8;

const generateInviteCode = () =>
  crypto.randomBytes(16).toString("base64url").slice(0, INVITE_LENGTH);

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer();
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Pot name is required." },
        { status: 400 },
      );
    }

    let pot = null;
    let error: { message: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const inviteCode = generateInviteCode();
      const response = await supabase
        .from("pots")
        .insert({ name, invite_code: inviteCode })
        .select("id,name,invite_code,created_at")
        .single();

      pot = response.data;
      error = response.error;

      if (!error) {
        break;
      }
    }

    if (!pot || error) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create pot." },
        { status: 500 },
      );
    }

    return NextResponse.json({ pot }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
