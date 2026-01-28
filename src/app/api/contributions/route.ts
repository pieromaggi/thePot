import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

type ContributionBody = {
  participant_id?: string;
  amount?: number;
  note?: string;
  occurred_at?: string;
  pot_id?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  const body = (await request.json()) as ContributionBody;

  if (!body.participant_id || !body.amount || body.amount <= 0 || !body.pot_id) {
    return NextResponse.json(
      { error: "participant_id, pot_id, and positive amount are required." },
      { status: 400 },
    );
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id")
    .eq("id", body.participant_id)
    .eq("pot_id", body.pot_id)
    .single();

  if (participantError || !participant) {
    return NextResponse.json(
      { error: "Participant does not belong to this pot." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("contributions")
    .insert({
      participant_id: body.participant_id,
      pot_id: body.pot_id,
      amount: body.amount,
      note: body.note?.trim() || null,
      occurred_at: body.occurred_at ?? undefined,
    })
    .select("id,participant_id,amount,note,occurred_at,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contribution: data }, { status: 201 });
}
