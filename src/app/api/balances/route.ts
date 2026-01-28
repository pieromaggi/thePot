import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

type Participant = {
  id: string;
  name: string;
};

const parseAmount = (value: number | string | null) => {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === "number" ? value : Number.parseFloat(value);
};

export async function GET(request: Request) {
  const supabase = getSupabaseServer();
  const potId = new URL(request.url).searchParams.get("pot_id");

  if (!potId) {
    return NextResponse.json(
      { error: "pot_id is required." },
      { status: 400 },
    );
  }

  const [participantsRes, contributionsRes, splitsRes] = await Promise.all([
    supabase
      .from("participants")
      .select("id,name")
      .eq("pot_id", potId)
      .order("name"),
    supabase
      .from("contributions")
      .select("participant_id,amount")
      .eq("pot_id", potId),
    supabase
      .from("expense_splits")
      .select("participant_id,amount")
      .eq("pot_id", potId),
  ]);

  if (participantsRes.error) {
    return NextResponse.json(
      { error: participantsRes.error.message },
      { status: 500 },
    );
  }

  if (contributionsRes.error) {
    return NextResponse.json(
      { error: contributionsRes.error.message },
      { status: 500 },
    );
  }

  if (splitsRes.error) {
    return NextResponse.json({ error: splitsRes.error.message }, { status: 500 });
  }

  const participants = (participantsRes.data ?? []) as Participant[];
  const balances = participants.map((participant) => ({
    participant_id: participant.id,
    name: participant.name,
    contributed: 0,
    owed: 0,
    balance: 0,
  }));

  const balancesById = new Map(
    balances.map((entry) => [entry.participant_id, entry]),
  );

  for (const contribution of contributionsRes.data ?? []) {
    const entry = balancesById.get(contribution.participant_id);
    if (!entry) continue;
    entry.contributed += parseAmount(contribution.amount);
  }

  for (const split of splitsRes.data ?? []) {
    const entry = balancesById.get(split.participant_id);
    if (!entry) continue;
    entry.owed += parseAmount(split.amount);
  }

  for (const entry of balances) {
    entry.balance = Number((entry.contributed - entry.owed).toFixed(2));
    entry.contributed = Number(entry.contributed.toFixed(2));
    entry.owed = Number(entry.owed.toFixed(2));
  }

  return NextResponse.json({ balances });
}
