import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

type ExpenseSplit = {
  participant_id: string;
  amount: number;
};

type ExpenseUpdateBody = {
  description?: string;
  total_amount?: number;
  paid_by_participant_id?: string;
  occurred_at?: string | null;
  splits?: ExpenseSplit[];
  pot_id?: string;
};

const toCents = (value: number) => Math.round(value * 100);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServer();
  const { id } = await context.params;
  const potId = new URL(request.url).searchParams.get("pot_id");

  if (!potId || potId === "undefined") {
    return NextResponse.json({ error: "pot_id is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
        id,
        description,
        total_amount,
        occurred_at,
        created_at,
        paid_by_participant_id,
        paid_by_participant:participants!expenses_paid_by_participant_id_fkey(name),
        splits:expense_splits(
          participant_id,
          amount,
          participant:participants(name)
        )
      `,
    )
    .eq("pot_id", potId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Expense not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ expense: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServer();
  const { id } = await context.params;
  const body = (await request.json()) as ExpenseUpdateBody;

  if (!body.pot_id || body.pot_id === "undefined") {
    return NextResponse.json({ error: "pot_id is required." }, { status: 400 });
  }

  if (
    !body.description?.trim() ||
    !body.total_amount ||
    body.total_amount <= 0
  ) {
    return NextResponse.json(
      { error: "description and positive total_amount are required." },
      { status: 400 },
    );
  }

  if (!body.splits?.length) {
    return NextResponse.json(
      { error: "At least one split entry is required." },
      { status: 400 },
    );
  }

  if (body.splits.some((split) => split.amount <= 0)) {
    return NextResponse.json(
      { error: "Split amounts must be greater than 0." },
      { status: 400 },
    );
  }

  const totalCents = toCents(body.total_amount);
  const splitsCents = body.splits.reduce(
    (sum, split) => sum + toCents(split.amount),
    0,
  );

  if (totalCents !== splitsCents) {
    return NextResponse.json(
      { error: "Split amounts must add up to total_amount." },
      { status: 400 },
    );
  }

  const participantIds = new Set(
    body.splits.map((split) => split.participant_id),
  );
  if (body.paid_by_participant_id) {
    participantIds.add(body.paid_by_participant_id);
  }
  const uniqueParticipantIds = Array.from(participantIds);

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("id")
    .eq("pot_id", body.pot_id)
    .in("id", uniqueParticipantIds);

  if (
    participantsError ||
    (participants?.length ?? 0) !== uniqueParticipantIds.length
  ) {
    return NextResponse.json(
      { error: "One or more participants are not in this pot." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      description: body.description.trim(),
      total_amount: body.total_amount,
      paid_by_participant_id: body.paid_by_participant_id ?? null,
      occurred_at: body.occurred_at ?? null,
    })
    .eq("id", id)
    .eq("pot_id", body.pot_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", id)
    .eq("pot_id", body.pot_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("expense_splits").insert(
    body.splits.map((split) => ({
      expense_id: id,
      pot_id: body.pot_id,
      participant_id: split.participant_id,
      amount: split.amount,
    })),
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
