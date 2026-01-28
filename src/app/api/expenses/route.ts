import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

type ExpenseSplit = {
  participant_id: string;
  amount: number;
};

type ExpenseBody = {
  description?: string;
  total_amount?: number;
  paid_by_participant_id?: string;
  occurred_at?: string;
  splits?: ExpenseSplit[];
  pot_id?: string;
};

const toCents = (value: number) => Math.round(value * 100);

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  const potId = new URL(request.url).searchParams.get("pot_id");

  if (!potId) {
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
        paid_by_participant:participants!expenses_paid_by_participant_id_fkey(name),
        splits:expense_splits(
          participant:participants(name),
          amount
        )
      `,
    )
    .eq("pot_id", potId)
    .order("occurred_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServer();
  const body = (await request.json()) as ExpenseBody;

  if (
    !body.description?.trim() ||
    !body.total_amount ||
    body.total_amount <= 0 ||
    !body.pot_id
  ) {
    return NextResponse.json(
      { error: "description, pot_id, and positive total_amount are required." },
      { status: 400 },
    );
  }

  if (!body.splits?.length) {
    return NextResponse.json(
      { error: "At least one split entry is required." },
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

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      description: body.description.trim(),
      pot_id: body.pot_id,
      total_amount: body.total_amount,
      paid_by_participant_id: body.paid_by_participant_id ?? null,
      occurred_at: body.occurred_at ?? undefined,
    })
    .select("id,description,total_amount,paid_by_participant_id,occurred_at")
    .single();

  if (expenseError || !expense) {
    return NextResponse.json(
      { error: expenseError?.message ?? "Failed to create expense." },
      { status: 500 },
    );
  }

  const { error: splitsError } = await supabase.from("expense_splits").insert(
    body.splits.map((split) => ({
      expense_id: expense.id,
      pot_id: body.pot_id,
      participant_id: split.participant_id,
      amount: split.amount,
    })),
  );

  if (splitsError) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return NextResponse.json({ error: splitsError.message }, { status: 500 });
  }

  return NextResponse.json({ expense }, { status: 201 });
}
